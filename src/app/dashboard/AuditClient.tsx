"use client";

import { useEffect, useMemo, useState } from "react";

type AuditResponse = {
  url: string;
  checks: {
    title: { value: string | null; ok: boolean };
    metaDescription: { value: string | null; ok: boolean };
    h1: { value: string | null; ok: boolean };
    robots: { value: string | null; ok: boolean };
    canonical: { value: string | null; ok: boolean };
    og: {
      title: { value: string | null; ok: boolean };
      description: { value: string | null; ok: boolean };
      url: { value: string | null; ok: boolean };
    };
    htmlLang: { value: string | null; ok: boolean };
    counts: { images: number; links: number; h1s: number };
    links?: { internal: number; external: number; nofollow: number };
  };
  pagespeed?: {
    strategy: "mobile" | "desktop" | string;
    performance: number | null;
    metrics: {
      fcpMs: number | null;
      lcpMs: number | null;
      cls: number | null;
      tbtMs: number | null;
      siMs: number | null;
    };
  } | null;
  pagespeedError?: { code?: number; statusText?: string; message?: string } | null;
};

export default function AuditClient() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResponse | null>(null);
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);

  const loadingMessages = useMemo(
    () => [
      "Fetching page…",
      "Parsing HTML…",
      "Analyzing metadata…",
      "Counting links and images…",
      "Requesting PageSpeed Insights…",
      "Crunching numbers…",
      "Almost there…",
    ],
    []
  );

  useEffect(() => {
    let progressTimer: ReturnType<typeof setInterval> | null = null;
    let messageTimer: ReturnType<typeof setInterval> | null = null;
    if (loading) {
      setProgress(5);
      setMsgIndex(0);
      progressTimer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 92) return prev; // cap until response arrives
          const increment = prev < 50 ? 3 : prev < 75 ? 2 : 1;
          return Math.min(prev + increment, 92);
        });
      }, 400);
      messageTimer = setInterval(() => {
        setMsgIndex((i) => (i + 1) % loadingMessages.length);
      }, 1500);
    }
    return () => {
      if (progressTimer) clearInterval(progressTimer);
      if (messageTimer) clearInterval(messageTimer);
    };
  }, [loading, loadingMessages.length]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/seo/audit?url=${encodeURIComponent(url)}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }
      const data: AuditResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError("Audit failed. Please check the URL and try again.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }

  return (
    <div className="grid gap-5">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 md:flex-row">
        <input
          name="url"
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/page"
          className="flex-1 rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 outline-none ring-0 focus:border-white/20"
        />
        <button
          disabled={loading}
          className="rounded-lg bg-white px-4 py-2 font-medium text-neutral-900 transition-colors hover:bg-neutral-200 disabled:opacity-50"
        >
          {loading ? "Auditing…" : "Run audit"}
        </button>
      </form>
      {loading && (
        <LoadingCard message={loadingMessages[msgIndex]} progress={progress} />
      )}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {result && <AuditResults data={result} />}
    </div>
  );
}

function Badge({ ok }: { ok: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium " +
        (ok
          ? "bg-green-500/15 text-green-300 ring-1 ring-inset ring-green-500/30"
          : "bg-yellow-500/15 text-yellow-300 ring-1 ring-inset ring-yellow-500/30")
      }
    >
      {ok ? "OK" : "Missing"}
    </span>
  );
}

function Field({ label, value, ok }: { label: string; value: string | null; ok: boolean }) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center gap-2 text-sm text-neutral-300">
        <span>{label}</span>
        <Badge ok={ok} />
      </div>
      <div className="rounded-lg border border-white/10 bg-neutral-800/70 px-3 py-2 text-sm text-neutral-100">
        {value || <span className="text-neutral-400">—</span>}
      </div>
    </div>
  );
}

function AuditResults({ data }: { data: AuditResponse }) {
  const { checks } = data;
  const summary = [
    { label: "Title", ok: checks.title.ok },
    { label: "Meta description", ok: checks.metaDescription.ok },
    { label: "H1", ok: checks.h1.ok },
    { label: "Canonical", ok: checks.canonical.ok },
    { label: "OG title", ok: checks.og.title.ok },
    { label: "OG description", ok: checks.og.description.ok },
    { label: "OG url", ok: checks.og.url.ok },
    { label: "HTML lang", ok: checks.htmlLang.ok },
  ];

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium">Results</h3>
            <p className="text-sm text-neutral-400">{data.url}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.map((s) => (
              <span key={s.label} className="text-xs text-neutral-300">
                {s.label}: <Badge ok={s.ok} />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-3">
          <Field label="Title" value={checks.title.value} ok={checks.title.ok} />
          <Field
            label="Meta description"
            value={checks.metaDescription.value}
            ok={checks.metaDescription.ok}
          />
          <Field label="H1" value={checks.h1.value} ok={checks.h1.ok} />
          <Field label="Robots meta" value={checks.robots.value} ok={checks.robots.ok} />
          <Field label="Canonical" value={checks.canonical.value} ok={checks.canonical.ok} />
        </div>

        <div className="grid gap-3">
          <Field label="OG title" value={checks.og.title.value} ok={checks.og.title.ok} />
          <Field
            label="OG description"
            value={checks.og.description.value}
            ok={checks.og.description.ok}
          />
          <Field label="OG url" value={checks.og.url.value} ok={checks.og.url.ok} />
          <Field label="HTML lang" value={checks.htmlLang.value} ok={checks.htmlLang.ok} />

          <div className="grid gap-1">
            <div className="text-sm text-neutral-300">Counts</div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-lg border border-white/10 bg-neutral-800/70 px-3 py-2">
                <div className="text-neutral-400">Images</div>
                <div className="font-medium text-neutral-100">{checks.counts.images}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-neutral-800/70 px-3 py-2">
                <div className="text-neutral-400">Links</div>
                <div className="font-medium text-neutral-100">{checks.counts.links}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-neutral-800/70 px-3 py-2">
                <div className="text-neutral-400">H1s</div>
                <div className="font-medium text-neutral-100">{checks.counts.h1s}</div>
              </div>
            </div>
          </div>

          {checks.links && (
            <div className="grid gap-1">
              <div className="text-sm text-neutral-300">Link breakdown</div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-lg border border-white/10 bg-neutral-800/70 px-3 py-2">
                  <div className="text-neutral-400">Internal</div>
                  <div className="font-medium text-neutral-100">{checks.links.internal}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-neutral-800/70 px-3 py-2">
                  <div className="text-neutral-400">External</div>
                  <div className="font-medium text-neutral-100">{checks.links.external}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-neutral-800/70 px-3 py-2">
                  <div className="text-neutral-400">Nofollow</div>
                  <div className="font-medium text-neutral-100">{checks.links.nofollow}</div>
                </div>
              </div>
            </div>
          )}

          {/* PageSpeed moved to full-width card below */}
        </div>
      </div>

      {/* Full-width PageSpeed card */}
      {data.pagespeed && (
        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5 grid gap-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-300">PageSpeed (Lighthouse)</div>
            <div className="text-xs text-neutral-400">Strategy: {data.pagespeed.strategy}</div>
          </div>
          <div className="grid grid-cols-5 gap-2 text-sm">
            <div className="rounded-lg border border-white/10 bg-neutral-800/70 px-3 py-2">
              <div className="text-neutral-400">Performance</div>
              <div className="font-medium text-neutral-100">
                {typeof data.pagespeed.performance === "number" ? Math.round(data.pagespeed.performance * 100) : "—"}
              </div>
            </div>
            <LhCell label="FCP" valueMs={data.pagespeed.metrics.fcpMs} />
            <LhCell label="LCP" valueMs={data.pagespeed.metrics.lcpMs} />
            <LhCell label="TBT" valueMs={data.pagespeed.metrics.tbtMs} />
            <LhCell label="Speed Index" valueMs={data.pagespeed.metrics.siMs} />
          </div>
        </div>
      )}

      {(!data.pagespeed && data.pagespeedError) && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-sm text-yellow-300">
          PageSpeed unavailable: {data.pagespeedError.message || `${data.pagespeedError.statusText || "error"} (${data.pagespeedError.code ?? ""})`}
        </div>
      )}
    </div>
  );
}

function LhCell({ label, valueMs }: { label: string; valueMs: number | null }) {
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-800/70 px-3 py-2">
      <div className="text-neutral-400">{label}</div>
      <div className="font-medium text-neutral-100">{valueMs == null ? "—" : Math.round(valueMs) + " ms"}</div>
    </div>
  );
}


function LoadingCard({ message, progress }: { message: string; progress: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5 grid gap-4">
      <div className="flex items-center gap-3">
        <Spinner />
        <div className="text-sm text-neutral-300">{message}</div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full rounded-full bg-white transition-[width] duration-300 ease-out"
          style={{ width: `${Math.max(5, Math.min(100, Math.round(progress)))}%` }}
        />
      </div>
      <div className="text-right text-xs text-neutral-400">{Math.max(5, Math.min(99, Math.round(progress)))}%</div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}


