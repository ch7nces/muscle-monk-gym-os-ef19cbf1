import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ArrowUpRight, Dumbbell, Menu, MessageCircle, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mapsUrl, whatsappUrl } from "@/lib/gym";
import { useGymSession } from "./session-provider";

const navigation = [
  { label: "About", to: "/about" }, { label: "Facilities", to: "/facilities" },
  { label: "Memberships", to: "/memberships" }, { label: "Trainers", to: "/trainers" },
  { label: "Contact", to: "/contact" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const { user } = useGymSession();
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);
  return <>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <header className="site-header">
      <div className="site-container flex min-h-20 items-center gap-6">
        <Link to="/" className="brand" aria-label="Muscle Monk Gymnasium home"><Dumbbell className="size-8 text-primary" strokeWidth={2.4} /><span><span className="block font-display text-2xl leading-none">MUSCLE MONK</span><span className="brand-subtitle">GYMNASIUM · RAU, INDORE</span></span></Link>
        <nav aria-label="Main navigation" className="ml-auto hidden items-center gap-6 xl:flex">{navigation.map((item) => <Link key={item.to} to={item.to} className="nav-link" activeProps={{ className: "nav-link nav-active" }}>{item.label}</Link>)}</nav>
        <div className="ml-auto hidden items-center gap-3 md:flex xl:ml-2"><Button asChild variant="ghost"><Link to={user ? "/account" : "/auth"}>{user ? "My account" : "Member login"}</Link></Button><Button asChild><Link to="/trial">Book free trial <ArrowUpRight /></Link></Button></div>
        <Button ref={trigger} size="icon" variant="ghost" className="ml-auto xl:hidden" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
      </div>
      {open && <nav id="mobile-navigation" aria-label="Mobile navigation" className="mobile-navigation site-container">{navigation.map((item) => <Link key={item.to} to={item.to} className="mobile-nav-link">{item.label}<ArrowUpRight className="size-4" /></Link>)}<Link to="/faq" className="mobile-nav-link">FAQ<ArrowUpRight className="size-4" /></Link><div className="flex flex-wrap gap-3 py-4"><Button asChild variant="outline"><Link to={user ? "/account" : "/auth"}>{user ? "My account" : "Member login"}</Link></Button><Button asChild><Link to="/trial">Book free trial</Link></Button></div></nav>}
    </header>
    <div id="main-content">{children}</div>
    <footer className="site-footer">
      <div className="site-container grid gap-12 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div><Link to="/" className="brand"><Dumbbell className="size-7 text-primary" /><span className="font-display text-3xl">MUSCLE MONK</span></Link><p className="mt-4 text-sm leading-7 text-muted-foreground">मसल मोंक जिम्नेजियम<br />Rau, Indore, Madhya Pradesh.</p><a href="tel:+919755966358" className="mt-5 inline-flex items-center gap-2 text-sm"><Phone className="size-4 text-primary" />+91 97559 66358</a></div>
        <div><h2 className="footer-heading">The gym</h2><nav aria-label="Footer gym navigation" className="footer-links"><Link to="/about">About Muscle Monk</Link><Link to="/facilities">Facilities</Link><Link to="/memberships">Memberships</Link><Link to="/trainers">Trainers</Link><Link to="/stories">Transformation stories</Link><Link to="/reviews">Customer reviews</Link></nav></div>
        <div><h2 className="footer-heading">Your next step</h2><nav aria-label="Footer contact navigation" className="footer-links"><Link to="/trial">Book a free trial</Link><Link to="/contact">Make an enquiry</Link><Link to="/faq">Frequently asked questions</Link><a href={mapsUrl} target="_blank" rel="noopener noreferrer">Get directions ↗</a><Link to={user ? "/account" : "/auth"}>{user ? "My account" : "Member & staff login"}</Link></nav></div>
      </div>
      <div className="site-container flex flex-wrap justify-between gap-3 border-t border-border py-6 text-xs text-muted-foreground"><span>© Muscle Monk Gymnasium</span><span>BUILD STRENGTH. BREAK LIMITS.</span></div>
    </footer>
    <a className="whatsapp-float" href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Contact Muscle Monk on WhatsApp" title="Contact on WhatsApp"><MessageCircle className="size-6" /></a>
  </>;
}