import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg bg-white/15 backdrop-blur grid place-items-center font-bold">H</div>
          <span className="font-semibold tracking-tight">Haleon</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight tracking-tight">E-Pharm Tracker</h2>
          <p className="mt-3 text-primary-foreground/85 max-w-md">
            Unified view of Sensodyne, Crocin, Centrum and more across PharmEasy, Zepto Pharmacy and Amazon Pharmacy.
          </p>
        </div>
        <div className="text-xs text-primary-foreground/70">Internal use only · v0.1 scaffold</div>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground mt-1">We'll send a sign-in link to your work email.</p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!email) return;
              setSent(true);
              setTimeout(() => navigate({ to: "/snapshot" }), 400);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" placeholder="you@haleon.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">{sent ? "Signing you in…" : "Email me a sign-in link"}</Button>
            <p className="text-xs text-muted-foreground text-center">Any email works in this scaffold.</p>
          </form>
        </div>
      </div>
    </div>
  );
}
