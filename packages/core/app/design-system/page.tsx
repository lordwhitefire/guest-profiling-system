// =============================================================================
// /design-system — preview page for the design system primitives
// =============================================================================
// Renders every base component. Used for visual verification per testing.md
// Section 7 (Design system checks).

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DesignSystemPage() {
  return (
    <main className="min-h-screen p-8 space-y-12">
      <header>
        <h1 className="font-heading text-3xl font-bold text-ink-900">
          Design System
        </h1>
        <p className="mt-2 text-ink-600">
          Base component primitives for the Guest Profiling System.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-ink-800">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-ink-800">Inputs</h2>
        <div className="max-w-sm space-y-3">
          <Input label="Email" type="email" placeholder="you@example.com" />
          <Input label="Phone" type="tel" placeholder="+234 800 000 0000" />
          <Input label="Disabled" disabled placeholder="Not editable" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-ink-800">Badges</h2>
        <div className="flex flex-wrap gap-3">
          <Badge variant="default">Default</Badge>
          <Badge variant="success">Checked in</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="danger">Escalated</Badge>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-ink-800">Card</h2>
        <Card className="max-w-md">
          <h3 className="font-heading text-lg font-semibold">John Doe</h3>
          <p className="text-sm text-ink-600">john@example.com</p>
          <p className="mt-2 text-sm text-ink-700">
            Total stays: 3 · Last stay: 2026-09-15 · Phase: IDLE
          </p>
        </Card>
      </section>
    </main>
  );
}
