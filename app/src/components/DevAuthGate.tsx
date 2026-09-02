import { useEffect, useState } from "react";

/**
 * The demo deployment does not require an interactive login.  This component
 * only probes the REST auth endpoint in the background so an existing session
 * can still be observed; it never redirects or creates a browser session.
 */
export default function DevAuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(true);

  useEffect(() => {
    void fetch("/api/auth/me", { credentials: "include" })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  return ready ? <>{children}</> : null;
}
