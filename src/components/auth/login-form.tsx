"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/auth/login-schema";
import { signIn } from "@/lib/auth/actions";

// Fictitious demo accounts; the shared password is documented in DATABASE.md.
const DEMO_PASSWORD = "IpelDemo#2026";
const DEMO_USERS = [
  { email: "ram.prasad@example.com", name: "Ram Prasad", role: "Owner" },
  { email: "tender@example.com", name: "Anita Kulkarni", role: "Tender" },
  { email: "purchase@example.com", name: "Rakesh Menon", role: "Purchase" },
  { email: "accounts@example.com", name: "Priya Iyer", role: "Accounts" },
  { email: "logistics@example.com", name: "Suresh Yadav", role: "Logistics" },
];

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [demoEmail, setDemoEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function submit(values: LoginInput, demo: string | null = null) {
    setServerError(null);
    setDemoEmail(demo);
    startTransition(async () => {
      const result = await signIn(values);
      if (result?.error) setServerError(result.error);
    });
  }

  const onSubmit = handleSubmit((values) => submit(values));

  function signInAsDemo(email: string) {
    submit({ email, password: DEMO_PASSWORD }, email);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            {serverError && (
              <p role="alert" data-testid="login-error" className="text-sm text-destructive">
                {serverError}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending && !demoEmail ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Demo accounts</CardTitle>
            <CardDescription>Tap a user to sign in as them.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {DEMO_USERS.map((u) => (
              <Button
                key={u.email}
                type="button"
                variant="outline"
                className="h-auto justify-between py-2"
                disabled={pending}
                onClick={() => signInAsDemo(u.email)}
              >
                <span className="truncate">{u.name}</span>
                <span className="text-xs text-muted-foreground">
                  {pending && demoEmail === u.email ? "Signing in…" : u.role}
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">
          Demo only: all data is fictitious.
        </p>
      </div>
    </div>
  );
}
