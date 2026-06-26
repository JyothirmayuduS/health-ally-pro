import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signUp } from "@/lib/supabase/auth";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { user } = await signUp(email, password, fullName);
      if (user) {
        setMessage("Account created. Check your email to confirm, or sign in if confirmation is disabled.");
        setTimeout(() => navigate({ to: "/login" }), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="card-soft w-full max-w-md p-8">
        <p className="label-eyebrow">Medora</p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-ink-muted">Register as a patient to book appointments and view records.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm">
            <span className="label-eyebrow">Full name</span>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20"
            />
          </label>
          <label className="block text-sm">
            <span className="label-eyebrow">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20"
            />
          </label>
          <label className="block text-sm">
            <span className="label-eyebrow">Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20"
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-clay">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-ink/90 disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-clay hover:text-ink">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
