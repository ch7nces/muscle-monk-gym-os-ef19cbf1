import { useId, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { indiaDate, publicRequestSchema } from "@/lib/gym";
import { publicGymOptions, submitPublicRequest } from "@/lib/gym.functions";
import { toast } from "sonner";

export function RequestForm({ kind }: { kind: "enquiry" | "trial" }) {
  const id = useId();
  const { data } = useSuspenseQuery(publicGymOptions);
  const submit = useServerFn(submitPublicRequest);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [consent, setConsent] = useState(false);
  const [slot, setSlot] = useState("");
  const slots = Array.isArray(data.settings?.trial_slots) ? data.settings.trial_slots.filter((s): s is string => typeof s === "string") : [];

  if (reference) return <div className="form-success" role="status"><CheckCircle2 className="mb-5 size-10 text-success" /><h2 className="font-display text-3xl">{kind === "trial" ? "Your trial request is in." : "Your enquiry is in."}</h2><p className="mt-3 text-muted-foreground">The gym team will contact you to {kind === "trial" ? "confirm your date and time" : "answer your enquiry"}.</p><p className="mt-4 break-all text-xs text-muted-foreground">Reference: {reference}</p><Button variant="outline" className="mt-6" onClick={() => { setReference(""); setConsent(false); setSlot(""); }}>Send another request</Button></div>;

  return <form className="gym-form" onSubmit={async (event) => {
    event.preventDefault();
    if (busy) return;
    const fd = new FormData(event.currentTarget);
    const parsed = publicRequestSchema.safeParse({ kind, name: fd.get("name") ?? "", phone: fd.get("phone") ?? "", email: fd.get("email") ?? "", message: fd.get("message") ?? "", date: fd.get("date") ?? "", slot, consent, website: fd.get("website") ?? "" });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Please check the form"); return; }
    setBusy(true); setError("");
    try { const result = await submit({ data: parsed.data }); setReference(result.reference); toast.success("Request received"); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to send your request"); }
    finally { setBusy(false); }
  }}>
    <div className="grid gap-5 sm:grid-cols-2"><label htmlFor={`${id}-name`}>Full name<Input id={`${id}-name`} name="name" autoComplete="name" placeholder="Your name" minLength={2} maxLength={120} required /></label><label htmlFor={`${id}-phone`}>Phone number<Input id={`${id}-phone`} name="phone" type="tel" autoComplete="tel" placeholder="Your contact number" maxLength={20} required /></label></div>
    <label htmlFor={`${id}-email`}>Email <span className="text-muted-foreground">(optional)</span><Input id={`${id}-email`} name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} /></label>
    {kind === "trial" && <div className="grid gap-5 sm:grid-cols-2"><label htmlFor={`${id}-date`}>Preferred date<Input id={`${id}-date`} name="date" type="date" min={indiaDate()} required /></label><label htmlFor={`${id}-slot`}>Time preference<Select value={slot} onValueChange={setSlot}><SelectTrigger id={`${id}-slot`} className="mt-2 h-12 w-full"><SelectValue placeholder="Choose a preference" /></SelectTrigger><SelectContent>{slots.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></label></div>}
    <label htmlFor={`${id}-message`}>{kind === "trial" ? "Your fitness goal (optional)" : "Your enquiry"}<Textarea id={`${id}-message`} name="message" placeholder={kind === "trial" ? "What would you like to work towards?" : "How can we help?"} required={kind === "enquiry"} minLength={kind === "enquiry" ? 5 : 0} maxLength={2000} rows={4} /></label>
    <div className="hidden" aria-hidden="true"><label>Website<Input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <div className="flex items-start gap-3"><Checkbox id={`${id}-consent`} checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} className="mt-1" /><label htmlFor={`${id}-consent`} className="consent-label">I agree to be contacted by Muscle Monk about this request. This does not subscribe me to promotions.</label></div>
    {kind === "trial" && <p className="text-xs leading-relaxed text-muted-foreground">This is a trial request, not a confirmed booking. The team will confirm availability and the exact time.</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" size="lg" disabled={busy} className="h-12 w-full">{busy ? <><LoaderCircle className="animate-spin" />Sending…</> : <>{kind === "trial" ? "Request free trial" : "Send enquiry"}<ArrowRight /></>}</Button>
  </form>;
}