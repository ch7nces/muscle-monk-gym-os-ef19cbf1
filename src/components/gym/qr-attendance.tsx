import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, QrCode, RefreshCw, ScanLine, Square, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { issueQr, redeemQr } from "@/lib/management.functions";
import { toast } from "sonner";

type CameraControls = { stop: () => void };
export function QrAttendance({ gymId, staff, member }: { gymId: string; staff: boolean; member: boolean }) {
  const issue = useServerFn(issueQr);
  const redeem = useServerFn(redeemQr);
  const cache = useQueryClient();
  const [pass, setPass] = useState<{ token: string; expiresAt: string; kind: string } | null>(null);
  const [image, setImage] = useState("");
  const [now, setNow] = useState(Date.now());
  const [entrance, setEntrance] = useState(false);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [camera, setCamera] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<CameraControls | null>(null);
  const scanning = useRef(false);
  const remaining = pass ? Math.max(0, Math.ceil((Date.parse(pass.expiresAt)-now)/1000)) : 0;
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(id); }, []);
  useEffect(() => {
    let cancelled = false;
    if (!pass) { setImage(""); return; }
    void import("qrcode").then(async qr => { const url = await qr.toDataURL(pass.token, { width: 300, margin: 3 }); if (!cancelled) setImage(url); }).catch(() => setError("QR could not render"));
    return () => { cancelled = true; };
  }, [pass]);
  useEffect(() => {
    if (!entrance) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function rotate() {
      try { const next = await issue({ data: { gymId, kind: "entrance" } }); if (stopped) return; setPass(next); setNow(Date.now()); timer = setTimeout(rotate, Math.max(1000, Date.parse(next.expiresAt)-Date.now())); }
      catch (e) { if (!stopped) { setError(e instanceof Error ? e.message : "QR unavailable"); setEntrance(false); setPass(null); } }
    }
    void rotate();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, [entrance, gymId, issue]);
  useEffect(() => () => controls.current?.stop(), []);
  async function generate() {
    setBusy(true); setError(""); setEntrance(false);
    try { setPass(await issue({ data: { gymId, kind: "member" } })); setNow(Date.now()); }
    catch (e) { setError(e instanceof Error ? e.message : "QR unavailable"); }
    finally { setBusy(false); }
  }
  async function checkIn(value: string) {
    if (scanning.current) return;
    scanning.current = true; setBusy(true); setError(""); setResult("");
    controls.current?.stop(); setCamera(false);
    try {
      const response = await redeem({ data: { gymId, token: value.trim() } });
      setResult(`${response.name ?? "Member"} checked in · ${new Date(response.checkedInAt ?? Date.now()).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}`);
      setToken(""); await cache.invalidateQueries({ queryKey: ["management"] }); toast.success("Check-in confirmed");
    } catch (e) { setError(e instanceof Error ? e.message : "Check-in failed"); }
    finally { scanning.current = false; setBusy(false); }
  }
  async function startCamera() {
    setError(""); setCamera(true);
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      if (!video.current) throw new Error("Camera not ready");
      controls.current = await new BrowserQRCodeReader().decodeFromVideoDevice(undefined, video.current, decoded => { if (decoded) void checkIn(decoded.getText()); });
    } catch { setCamera(false); setError("Camera unavailable. Allow camera access or upload a QR image."); }
  }
  return <div className="grid gap-10 lg:grid-cols-2"><section><h2 className="font-display text-3xl">QR PASSES</h2><div className="my-5 flex flex-wrap gap-3">{staff && <Button variant={entrance ? "secondary" : "outline"} onClick={() => { setError(""); setEntrance(!entrance); setPass(null); }}><QrCode />{entrance ? "Close entrance display" : "Entrance display"}</Button>}{member && <Button disabled={busy} onClick={generate}><RefreshCw />My member pass</Button>}</div>{pass && remaining > 0 && image ? <div className="w-fit"><img src={image} alt={`${pass.kind} QR pass`} className="aspect-square w-[300px] max-w-full" /><p className="mt-3 text-sm text-muted-foreground" role="status">{pass.kind === "entrance" ? "Entrance" : "Member"} pass · expires in {remaining}s</p></div> : <p className="py-6 text-muted-foreground">{pass ? "Pass expired." : "No active QR pass."}</p>}</section><section><h2 className="font-display text-3xl">SCAN & CHECK IN</h2><div className="my-5 flex flex-wrap gap-3"><Button variant="outline" disabled={busy || camera} onClick={startCamera}><Camera />Open camera</Button>{camera && <Button variant="outline" onClick={() => { controls.current?.stop(); setCamera(false); }}><Square />Stop</Button>}<label className="inline-flex"><Button asChild variant="outline"><span><Upload />Upload QR<input aria-label="Upload QR image" className="sr-only" type="file" accept="image/*" onChange={async e => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; const url = URL.createObjectURL(file); setError(""); try { const { BrowserQRCodeReader } = await import("@zxing/browser"); const decoded = await new BrowserQRCodeReader().decodeFromImageUrl(url); await checkIn(decoded.getText()); } catch { setError("No readable QR found in this image"); } finally { URL.revokeObjectURL(url); } }} /></span></Button></label></div><video ref={video} className={camera ? "aspect-[4/3] w-full rounded-md bg-muted" : "hidden"} muted playsInline /><form className="mt-5 flex gap-3" onSubmit={e => { e.preventDefault(); void checkIn(token); }}><Input aria-label="QR pass code" value={token} onChange={e => setToken(e.target.value)} placeholder="QR pass code" required maxLength={300} /><Button type="submit" disabled={busy} aria-label="Check in"><ScanLine /></Button></form>{result && <p role="status" className="mt-5 text-success">{result}</p>}{error && <p role="alert" className="mt-5 text-destructive">{error}</p>}</section></div>;
}
