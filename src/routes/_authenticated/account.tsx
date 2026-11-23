import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Check, ClipboardList, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { accountOptions, getEnquiries, updateRequest } from "@/lib/account.functions";
import { pageHead } from "@/lib/gym";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({ head: () => pageHead("My GYM OS account", "Your secure Muscle Monk account and authorized gym enquiry workspace."), loader: ({ context }) => context.queryClient.ensureQueryData(accountOptions), component: Account });

function Account() {
  const { data } = useSuspenseQuery(accountOptions);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const gyms = data.roles.filter((r) => ["owner", "manager", "receptionist"].includes(r.role));
  const [selected, setSelected] = useState("");
  const gym = selected || gyms[0]?.gym_id || "";
  return <main className="site-container py-12 md:py-16"><div className="flex flex-wrap items-start justify-between gap-6"><div><p className="section-eyebrow">GYM OS · SECURE ACCOUNT</p><h1 className="mt-4 font-display text-5xl">HELLO{data.profile?.full_name ? `, ${data.profile.full_name.toUpperCase()}` : ""}.</h1></div><Button variant="outline" onClick={async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); await navigate({ to: "/auth", replace: true }); }}><LogOut />Sign out</Button></div>
    {data.roles.length === 0 ? <div className="pending-details mt-10"><ClipboardList className="mb-5 size-8 text-primary" /><h2 className="font-display text-3xl">YOUR ACCOUNT IS READY.</h2><p className="mt-4 max-w-xl leading-7 text-muted-foreground">Your account has no gym membership or staff access assigned yet. Contact Muscle Monk to connect your membership or request authorized staff access.</p><p className="mt-3 text-sm text-muted-foreground">Creating an account does not grant owner or staff permissions.</p><Button asChild className="mt-6"><a href="tel:+919755966358">Call +91 97559 66358</a></Button></div> : <div className="mt-10"><div className="flex flex-wrap items-center justify-between gap-5 border-b border-border pb-6"><div><h2 className="font-display text-3xl">{data.roles.find((r) => r.gym_id === gym)?.gyms?.name ?? "Your gym access"}</h2><p className="mt-2 text-sm text-muted-foreground">{data.roles.filter((r) => r.gym_id === gym).map((r) => r.role).join(" · ")}</p></div>{gyms.length > 1 && <Select value={gym} onValueChange={setSelected}><SelectTrigger className="w-64"><SelectValue /></SelectTrigger><SelectContent>{gyms.map((r) => <SelectItem key={r.gym_id + r.role} value={r.gym_id}>{r.gyms?.name ?? r.gym_id}</SelectItem>)}</SelectContent></Select>}</div>{gym ? <EnquiryWorkspace gymId={gym} /> : <p className="mt-8 text-muted-foreground">Your gym role is assigned. Membership and training portals are still in development.</p>}</div>}
    <Button asChild variant="outline" className="mt-8"><Link to="/dashboard">Open GYM OS dashboard</Link></Button>
  </main>;
}

function EnquiryWorkspace({ gymId }: { gymId: string }) {
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState("");
  const load = useServerFn(getEnquiries);
  const update = useServerFn(updateRequest);
  const queryClient = useQueryClient();
  const { data, isPending, error } = useQuery({ queryKey: ["enquiry-workspace", gymId, page], queryFn: () => load({ data: { gymId, page } }) });
  async function change(input: { kind: "trial"; id: string; gymId: string; status: "pending" | "confirmed" | "completed" | "no_show" | "cancelled" } | { kind: "enquiry"; id: string; gymId: string; handled: boolean }) {
    setBusy(input.id);
    try { await update({ data: input }); await queryClient.invalidateQueries({ queryKey: ["enquiry-workspace", gymId] }); toast.success("Request updated"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not update request"); }
    finally { setBusy(""); }
  }
  if (isPending) return <p className="py-10 text-muted-foreground" role="status">Loading your gym’s requests…</p>;
  if (error || !data) return <div className="py-10"><p role="alert" className="text-destructive">{error?.message ?? "Unable to load requests"}</p><Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ["enquiry-workspace", gymId] })}>Try again</Button></div>;
  return <div className="py-8"><div className="grid gap-10 xl:grid-cols-2"><section><h2 className="mb-5 font-display text-3xl">TRIAL REQUESTS <span className="text-muted-foreground">({data.trialsCount})</span></h2>{data.trials.length === 0 ? <p className="text-sm text-muted-foreground">No trial requests yet.</p> : <div className="divide-y divide-border">{data.trials.map((t) => <article key={t.id} className="py-5"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-semibold">{t.full_name}</h3><a href={`tel:${t.phone}`} className="mt-1 block text-sm text-primary">{t.phone}</a><p className="mt-2 text-sm text-muted-foreground">{t.preferred_date} · {t.time_slot}</p></div><Select value={t.status} disabled={busy === t.id} onValueChange={(status) => { if (status === "pending" || status === "confirmed" || status === "completed" || status === "no_show" || status === "cancelled") void change({ kind: "trial", id: t.id, gymId, status }); }}><SelectTrigger aria-label={`Status for ${t.full_name}`} className="w-36"><SelectValue /></SelectTrigger><SelectContent>{["pending", "confirmed", "completed", "no_show", "cancelled"].map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>{t.fitness_goal && <p className="mt-3 text-sm text-muted-foreground">{t.fitness_goal}</p>}</article>)}</div>}</section><section><h2 className="mb-5 font-display text-3xl">ENQUIRIES <span className="text-muted-foreground">({data.enquiriesCount})</span></h2>{data.enquiries.length === 0 ? <p className="text-sm text-muted-foreground">No enquiries yet.</p> : <div className="divide-y divide-border">{data.enquiries.map((e) => <article key={e.id} className="py-5"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-semibold">{e.full_name}</h3><a href={`tel:${e.phone}`} className="mt-1 block text-sm text-primary">{e.phone}</a></div><Button variant={e.handled ? "secondary" : "outline"} disabled={busy === e.id} onClick={() => change({ kind: "enquiry", id: e.id, gymId, handled: !e.handled })}>{e.handled && <Check />}{e.handled ? "Handled" : "Mark handled"}</Button></div><p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{e.message}</p></article>)}</div>}</section></div><div className="mt-10 flex items-center justify-between border-t border-border pt-6"><Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}><ArrowLeft />Previous</Button><span className="text-sm text-muted-foreground">Page {page + 1}</span><Button variant="outline" disabled={(page + 1) * 20 >= Math.max(data.trialsCount, data.enquiriesCount)} onClick={() => setPage(page + 1)}>Next<ArrowRight /></Button></div></div>;
}