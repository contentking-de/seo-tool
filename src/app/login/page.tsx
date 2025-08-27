"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password");
        return;
      }
      router.push("/dashboard");
    });
  }

  return (
    <div className="min-h-dvh grid place-items-center bg-neutral-950 text-white">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-xl">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Welcome back</h1>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm text-neutral-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 outline-none ring-0 focus:border-white/20"
              placeholder="you@company.com"
              autoComplete="email"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="password" className="text-sm text-neutral-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 outline-none ring-0 focus:border-white/20"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="mt-2 inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 font-medium text-neutral-900 transition-colors hover:bg-neutral-200 disabled:opacity-50"
          >
            {isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}


