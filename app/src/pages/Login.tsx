import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";

const apiBaseUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");
const authEndpoint = (path: string) =>
  apiBaseUrl ? new URL(path, `${apiBaseUrl}/`).toString() : path;

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [countryCode, setCountryCode] = useState("PL");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch(authEndpoint(`/api/auth/${mode}`), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "register"
          ? { email, password, name, companyName, countryCode }
          : { email, password }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Login failed.");
      navigate("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Login failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>{mode === "login" ? "Sign in" : "Create your organization"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            {mode === "register" && (
              <>
                <label className="block text-sm font-medium">
                  Your name
                  <input className="mt-1 w-full rounded border p-2" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" />
                </label>
                <label className="block text-sm font-medium">
                  Company name
                  <input className="mt-1 w-full rounded border p-2" value={companyName} onChange={(event) => setCompanyName(event.target.value)} required />
                </label>
                <label className="block text-sm font-medium">
                  Country code
                  <input className="mt-1 w-full rounded border p-2 uppercase" value={countryCode} onChange={(event) => setCountryCode(event.target.value.toUpperCase())} required minLength={2} maxLength={2} />
                </label>
              </>
            )}
            <label className="block text-sm font-medium">
              Email
              <input className="mt-1 w-full rounded border p-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
            </label>
            <label className="block text-sm font-medium">
              Password
              <input className="mt-1 w-full rounded border p-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={mode === "register" ? 12 : undefined} autoComplete={mode === "register" ? "new-password" : "current-password"} />
            </label>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <Button className="w-full" size="lg" type="submit" disabled={pending}>
              {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>
          <button
            className="mt-4 w-full text-sm text-primary underline"
            type="button"
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
          >
            {mode === "login" ? "Create the first organization account" : "I already have an account"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
