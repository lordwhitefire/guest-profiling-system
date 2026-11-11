"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Search, Zap, UserRound, Hotel } from "lucide-react";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [visible,setVisible]=useState(false);
  const [remember,setRemember]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [submitting,setSubmitting]=useState(false);
  const [help,setHelp]=useState(false);

  async function handleSubmit(e:FormEvent) {
    e.preventDefault(); setError(null); setSubmitting(true);
    try {
      const res=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
      if(!res.ok){const body=await res.json();setError(body?.error?.message??"Unable to sign in. Check your details and try again.");return;}
      router.push("/workspace/dashboard");
    } catch { setError("Network error. Please check your connection and try again."); }
    finally { setSubmitting(false); }
  }

  return <main className="gps-login">
    <section className="gps-login-story">
      <div className="gps-login-brand"><span className="gps-login-mark"><i/></span><span><b>Guest Profiling</b><small>System</small></span></div>
      <div className="gps-login-copy"><span className="gps-login-eyebrow">SMARTER GUEST EXPERIENCES</span><h1>Identify Returning Guests.<br/>Deliver a <em>Better Stay.</em></h1><p>Search, recognise and manage guest profiles with ease — so every guest feels remembered.</p>
        <div className="gps-login-features"><div><span><Search/></span><div><b>Quick Guest Search</b><small>Find returning guests in seconds.</small></div></div><div><span><Zap/></span><div><b>Seamless Integration</b><small>Works with your existing hotel PMS.</small></div></div><div><span><ShieldCheck/></span><div><b>Secure & Reliable</b><small>Your guest data is always protected.</small></div></div></div>
      </div>
      <div className="gps-login-story-foot"><LockKeyhole size={13}/> Powered by Modern Hotel Technology</div>
    </section>
    <section className="gps-login-form-side">
      <div className="gps-login-top"><span><Hotel size={14}/> Grand Vista Hotel</span><small>Secure Hotel Workspace</small></div>
      <form className="gps-login-card" onSubmit={handleSubmit}>
        <div className="gps-login-card-icon"><span className="gps-login-mark"><i/></span></div>
        <h2>Welcome Back</h2><p>Sign in to your account to continue.</p>
        {error&&<div className="gps-login-error" role="alert">{error}</div>}
        <label>Email Address<div className="gps-login-input"><Mail size={16}/><input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@hotel.com"/></div></label>
        <label>Password<div className="gps-login-input"><LockKeyhole size={16}/><input type={visible?"text":"password"} autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"/><button type="button" onClick={()=>setVisible(!visible)} aria-label={visible?"Hide password":"Show password"}>{visible?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></label>
        <div className="gps-login-options"><label className="gps-login-check"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/> Remember me</label><button type="button" onClick={()=>setHelp(true)}>Forgot password?</button></div>
        <button className="gps-login-submit" type="submit" disabled={submitting}>{submitting?"Signing in…":"Sign In"} <span>→</span></button>
        <div className="gps-login-or"><span/>or<span/></div>
        <button type="button" className="gps-login-sso" onClick={()=>setError("Single sign-on is not configured for this workspace.")}><ShieldCheck size={15}/> Secure Sign-In · Your data is safe with us</button>
        <small className="gps-login-terms">By signing in, you agree to our <a href="#" onClick={e=>{e.preventDefault();setHelp(true)}}>Terms of Service</a> and <a href="#" onClick={e=>{e.preventDefault();setHelp(true)}}>Privacy Policy</a>.</small>
      </form>
      <div className="gps-login-footer">© 2026 Guest Profiling System. All rights reserved.</div>
    </section>
    {help&&<div className="gps-login-help-backdrop" onClick={()=>setHelp(false)}><div className="gps-login-help" onClick={e=>e.stopPropagation()}><button onClick={()=>setHelp(false)}>×</button><h3>Need help signing in?</h3><p>Please contact your hotel administrator to reset your password or request workspace access.</p><a href="mailto:admin@grandvista.com">Contact hotel administrator</a></div></div>}
  </main>;
}
