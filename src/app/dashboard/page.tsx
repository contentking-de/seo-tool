import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import SignOutButton from "./signout";
import AuditClient from "./AuditClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  return (
    <div className="min-h-dvh bg-neutral-950 text-white">
      <div className="mx-auto max-w-5xl p-6">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">SEO Tool</h1>
          <nav className="text-sm text-neutral-300">
            <SignOutButton />
          </nav>
        </header>
        <section className="grid gap-6">
          <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
            <h2 className="mb-2 text-lg font-medium">Welcome{session?.user?.name ? `, ${session.user.name}` : ""}</h2>
            <p className="text-neutral-300">Use the audit tool below to analyze a page.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
            <AuditClient />
          </div>
        </section>
      </div>
    </div>
  );
}

