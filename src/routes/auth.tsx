import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGymSession } from "@/components/gym/session-provider";
import { pageHead } from "@/lib/gym";

export const Route = createFileRoute("/auth")({ head: () => pageHead("Member & staff sign-in", "Secure member, trainer and staff account access for Muscle Monk Gymnasium."), component: Auth });

function GoogleMark() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" /><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" /><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" /><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" /></svg>; }

function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { user, ready } = useGymSession();
  const navigate = useNavigate();
  useEffect(() => { if (ready && user) void navigate({ to: "/account", replace: true }); }, [user, ready, navigate]);
  const changeMode = (next: typeof mode) => { setMode(next); setMessage(""); setError(""); };
  async function social(provider: "google" | "lovable") {
    setBusy(true); setError("");
    try { const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` }); if (result.error) setError("Sign-in could not finish. Please try again."); }
    catch { setError("Sign-in could not finish. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="auth-section"><div className="auth-panel"><p className="section-eyebrow">MUSCLE MONK · GYM OS</p><h1 className="mt-4 font-display text-4xl">{mode === "signup" ? "CREATE YOUR ACCOUNT" : mode === "forgot" ? "RESET YOUR PASSWORD" : "WELCOME BACK."}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{mode === "signup" ? "Register, verify your email, then ask the gym to connect your membership." : mode === "forgot" ? "We’ll email you a secure password-reset link." : "One secure sign-in for members, trainers and staff."}</p>
    {message ? <div role="status" className="mt-8"><p className="text-sm leading-7">{message}</p><Button variant="outline" className="mt-5" onClick={() => changeMode("login")}>Back to sign in</Button></div> : <>
    <form className="gym-form mt-7" onSubmit={async (event) => {
      event.preventDefault(); if (busy) return;
      const fd = new FormData(event.currentTarget); const email = String(fd.get("email") ?? "").trim(); const password = String(fd.get("password") ?? "");
      setBusy(true); setError("");
      try {
        if (mode === "forgot") {
          const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
          if (err) throw err; setMessage("If this email has an account, a reset link is on its way. Check your inbox and spam folder.");
        } else if (mode === "signup") {
          const { error: err, data } = await supabase.auth.signUp({ email, password, options: { data: { full_name: String(fd.get("name") ?? "").trim() }, emailRedirectTo: `${window.location.origin}/auth` } });
          if (err) throw err;
          if (data.session) await navigate({ to: "/account", replace: true });
          else setMessage("Check your email to verify your account. After verification, sign in to continue. Staff access is assigned separately by the gym.");
        } else {
          const { error: err } = await supabase.auth.signInWithPassword({ email, password });
          if (err) throw err; await navigate({ to: "/account", replace: true });
        }
      } catch (e) { setError(e instanceof Error ? e.message : "Unable to complete sign-in"); }
      finally { setBusy(false); }
    }}>{mode === "signup" && <label htmlFor="auth-name">Full name<Input id="auth-name" name="name" autoComplete="name" minLength={2} maxLength={120} required /></label>}<label htmlFor="auth-email">Email<Input id="auth-email" name="email" type="email" autoComplete="email" maxLength={254} required /></label>{mode !== "forgot" && <label htmlFor="auth-password">Password<Input id="auth-password" name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} maxLength={128} required />{mode === "signup" && <span className="mt-2 block text-xs text-muted-foreground">Use at least 8 characters.</span>}</label>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button className="h-12" disabled={busy} type="submit">{busy ? <LoaderCircle className="animate-spin" /> : <>{mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}<ArrowRight /></>}</Button></form>
    {mode !== "forgot" && <><div className="my-6 flex items-center gap-4"><span className="section-rule flex-1" /><span className="text-xs text-muted-foreground">or continue with</span><span className="section-rule flex-1" /></div><div className="grid gap-3"><Button variant="outline" className="auth-provider h-11 w-full" disabled={busy} onClick={() => social("google")}><GoogleMark />Continue with Google</Button><Button variant="outline" className="auth-provider h-11 w-full" disabled={busy} onClick={() => social("lovable")}><LovableMark className="size-[18px]" />Continue with Lovable</Button></div></>}
    <div className="mt-6 flex flex-wrap justify-between gap-3"><Button variant="link" className="h-auto p-0 text-xs" onClick={() => changeMode(mode === "signup" ? "login" : "signup")}>{mode === "signup" ? "Already have an account? Sign in" : "Create an account"}</Button>{mode === "login" && <Button variant="link" className="h-auto p-0 text-xs" onClick={() => changeMode("forgot")}>Forgot password?</Button>}{mode === "forgot" && <Button variant="link" className="h-auto p-0 text-xs" onClick={() => changeMode("login")}>Back to sign in</Button>}</div>
    </>}<p className="mt-8 border-t border-border pt-5 text-xs leading-6 text-muted-foreground">Need help with your membership? <Link to="/contact" className="text-primary">Contact the gym</Link>.</p>
  </div></main>;
}