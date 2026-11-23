import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import gymPhoto from "@/assets/hero-gym.jpg.asset.json";
import { pageHead } from "@/lib/gym";
import { publicGymOptions } from "@/lib/gym.functions";

export const Route = createFileRoute("/")({
  head: () => pageHead("Build strength. Break limits.", "Train harder. Grow stronger. Discover your potential at Muscle Monk Gymnasium, Rau, Indore. Request a free trial or enquire about membership."),
  loader: ({ context }) => context.queryClient.ensureQueryData(publicGymOptions),
  component: Index,
});

function Index() {
  const { data } = useSuspenseQuery(publicGymOptions);
  return (
    <main>
      <section className="home-hero">
        <img src={gymPhoto.url} alt="Illustrative strength-training space; temporary generated image, not a photograph of the gym" className="home-hero-image animate-slow-zoom" />
        <div className="site-container hero-inner animate-rise">
          <p className="hero-kicker">MUSCLE MONK GYMNASIUM · RAU, INDORE</p>
          <h1 className="hero-title">BUILD STRENGTH.<br /><span className="text-primary">BREAK LIMITS.</span></h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-muted-foreground md:text-lg md:leading-8">Train harder. Grow stronger. Discover your potential at Muscle Monk Gymnasium, Rau, Indore.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg" className="h-12"><Link to="/contact">Join now <ArrowUpRight /></Link></Button><Button asChild variant="outline" size="lg" className="h-12"><Link to="/trial">Book free trial <ArrowUpRight /></Link></Button></div>
          <Link to="/memberships" className="mt-7 inline-flex items-center gap-3 text-sm">Explore memberships <ArrowRight className="size-4 text-primary" /></Link>
        </div>
        <span className="hero-caption">TEMPORARY GENERATED IMAGE · GYM PHOTOS AWAITED</span>
      </section>
      <section className="home-intro"><div className="site-container flex flex-wrap items-center justify-between gap-5 py-6"><div className="flex items-center gap-3"><MapPin className="size-5 text-primary" /><p className="text-xs leading-6 text-muted-foreground">RAU, INDORE<br /><span className="text-foreground">Above Cooperative Bank · Sai Vihar Colony</span></p></div><p className="font-display text-xl">YOUR GOALS. YOUR JOURNEY. YOUR GYM.</p><a className="flex items-center gap-2 text-sm" href="tel:+919755966358"><Phone className="size-4 text-primary" />+91 97559 66358</a></div></section>
      <section className="site-container home-section grid gap-10 md:grid-cols-2"><div><p className="section-eyebrow">WELCOME TO MUSCLE MONK</p><h2 className="section-title mt-5">A STRONGER YOU.<br /><span className="text-muted-foreground">STARTS HERE.</span></h2></div><div><p className="text-lg leading-8 text-muted-foreground">{data.settings?.about_text || "A new goal. A fresh start. A reason to show up. Take your next step at Muscle Monk Gymnasium in Rau, Indore."}</p><p className="mt-5 text-sm leading-7 text-muted-foreground">Come visit the gym, meet the team, and ask about the membership that fits your training goals.</p><Button asChild variant="link" className="mt-5 px-0"><Link to="/about">About Muscle Monk <ArrowUpRight /></Link></Button></div></section>
      <section className="cta-band"><div className="site-container home-section"><div className="flex flex-wrap items-end justify-between gap-6"><div><p className="section-eyebrow">FIND YOUR WAY FORWARD</p><h2 className="section-title mt-4">MAKE IT YOUR OWN.</h2></div><Link to="/trial" className="inline-flex items-center gap-2 text-sm">Visit the gym <ArrowUpRight className="size-4 text-primary" /></Link></div><div className="mt-10 grid gap-x-12 md:grid-cols-3">{[{ to: "/facilities", number: "01", title: "THE TRAINING SPACE", description: data.facilities.length ? "Explore our published facilities." : "Visit us to explore the space. Confirmed facility details are coming soon." }, { to: "/memberships", number: "02", title: "YOUR MEMBERSHIP", description: data.plans.length ? "Compare current membership options." : "Ask the team about current plans and prices. No unconfirmed prices." }, { to: "/trainers", number: "03", title: "YOUR SUPPORT", description: data.trainers.length ? "Get to know the training team." : "Speak to the team about coaching. Trainer profiles are awaiting confirmation." }].map((item) => <Link key={item.to} to={item.to as "/facilities" | "/memberships" | "/trainers"} className="home-feature"><p className="text-xs text-primary">{item.number}</p><div className="mt-5 flex items-center justify-between gap-3"><h3 className="font-display text-3xl transition-colors">{item.title}</h3><ArrowUpRight className="size-5 text-primary" /></div><p className="mt-4 text-sm leading-7 text-muted-foreground">{item.description}</p></Link>)}</div></div></section>
      <section className="site-container home-section"><div className="grid gap-10 md:grid-cols-2"><div><p className="section-eyebrow">PEOPLE. PROGRESS. PERSPECTIVE.</p><h2 className="section-title mt-5">EVERY JOURNEY<br />HAS A STORY.</h2><p className="mt-6 max-w-lg text-sm leading-7 text-muted-foreground">Approved member stories and customer reviews will be shared here. Until then, come meet the community for yourself.</p></div><div className="self-center"><Link to="/stories" className="home-feature"><div className="flex items-center justify-between"><h3 className="font-display text-3xl">TRANSFORMATION STORIES</h3><ArrowUpRight className="size-5 text-primary" /></div><p className="mt-3 text-sm text-muted-foreground">Real stories, shared with permission.</p></Link><Link to="/reviews" className="home-feature"><div className="flex items-center justify-between"><h3 className="font-display text-3xl">CUSTOMER REVIEWS</h3><ArrowUpRight className="size-5 text-primary" /></div><p className="mt-3 text-sm text-muted-foreground">Hear from the people who train here.</p></Link></div></div></section>
      <section className="cta-band"><div className="site-container flex flex-wrap items-center justify-between gap-8 py-14"><div><p className="section-eyebrow">STOP WAITING. START SHOWING UP.</p><h2 className="section-title mt-4">YOUR FIRST STEP IS FREE.</h2><p className="mt-4 text-sm text-muted-foreground">Request a trial. The team will confirm your visit.</p></div><Button asChild size="lg" className="h-12"><Link to="/trial">Book free trial <ArrowUpRight /></Link></Button></div></section>
      <section className="site-container flex flex-wrap justify-between gap-6 py-10"><p className="text-muted-foreground">Questions before you join?</p><div className="flex gap-6"><Link to="/faq" className="text-sm">Read the FAQ ↗</Link><Link to="/contact" className="text-sm text-primary">Talk to us ↗</Link></div></section>
    </main>
  );
}
