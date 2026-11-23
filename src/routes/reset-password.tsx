import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useGymSession } from "@/components/gym/session-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/gym";

export const Route = createFileRoute("/reset-password")({ head: () => pageHead("Choose a new password", "Securely reset your Muscle Monk Gymnasium account password."), component: ResetPassword });
function ResetPassword() {
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const { user, ready } = useGymSession();
  const navigate = useNavigate();
  useEffect(() => { const params = new URLSearchParams(window.location.hash.slice(1)); setRecovery(params.get("type") === "recovery" || sessionStorage.getItem("gym-password-recovery") === "true"); }, [user, ready]);
  return <main className="auth-section"><div className="auth-panel"><p className="section-eyebrow">MUSCLE MONK · GYM OS</p><h1 className="mt-4 font-display text-4xl">A FRESH START.</h1>{!ready ? <p className="mt-6 text-muted-foreground" role="status">Checking your reset link…</p> : done ? <div className="mt-6" role="status"><p>Your password has been updated.</p><Button className="mt-5" onClick={() => navigate({ to: "/account" })}>Go to my account</Button></div> : !user || !recovery ? <div className="mt-6"><p className="text-sm leading-7 text-muted-foreground">Open the secure reset link from your email. If it has expired, request a new one.</p><Button asChild variant="outline" className="mt-5"><Link to="/auth">Return to sign in</Link></Button></div> : <form className="gym-form mt-6" onSubmit={async (event) => { event.preventDefault(); const fd = new FormData(event.currentTarget); const password = String(fd.get("password") ?? ""); if (password !== fd.get("confirm")) { setError("Passwords don’t match"); return; } setBusy(true); setError(""); const { error: err } = await supabase.auth.updateUser({ password }); setBusy(false); if (err) setError(err.message); else { sessionStorage.removeItem("gym-password-recovery"); setDone(true); } }}><label htmlFor="new-password">New password<Input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></label><label htmlFor="confirm-password">Confirm password<Input id="confirm-password" name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button disabled={busy} className="h-12">{busy ? "Updating…" : "Update password"}</Button></form>}</div></main>;
}