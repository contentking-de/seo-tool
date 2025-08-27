import Link from "next/link";
export const metadata = {
  title: "Login",
  description: "Access your SEO Tool dashboard and run on-page audits.",
};

export default function Home() {
  return (
    <div className="min-h-dvh grid place-items-center bg-neutral-950 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight">SEO Tool</h1>
        <p className="mt-2 text-neutral-300">Sign in to access your dashboard.</p>
        <div className="mt-6">
          <Link href="/login" className="rounded-lg bg-white px-4 py-2 font-medium text-neutral-900 hover:bg-neutral-200">
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
