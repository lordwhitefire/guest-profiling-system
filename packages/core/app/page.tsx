import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="max-w-2xl text-center space-y-4">
        <h1 className="font-heading text-4xl font-bold text-ink-900">
          Guest Profiling System
        </h1>
        <p className="text-ink-600">
          Foundation scaffold (TASK-001). No user-facing features yet — see{" "}
          <code className="font-mono text-accent">openspec/tasks-registry.md</code>{" "}
          for the build roadmap.
        </p>
      </div>
      <nav className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-accent px-4 py-2 text-accent-foreground hover:bg-accent-muted transition-colors"
        >
          Login
        </Link>
        <Link
          href="/design-system"
          className="rounded-lg border border-ink-300 px-4 py-2 text-ink-700 hover:bg-ink-100 transition-colors"
        >
          Design system preview
        </Link>
      </nav>
    </main>
  );
}
