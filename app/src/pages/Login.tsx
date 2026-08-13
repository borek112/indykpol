import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const apiBaseUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");

  if (!kimiAuthUrl || !appID || !apiBaseUrl) {
    throw new Error("Production authentication is not configured");
  }

  const apiOrigin = new URL(apiBaseUrl).origin;
  const redirectUri = `${apiOrigin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const oauthAvailable = Boolean(kimiAuthUrl && appID);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          {oauthAvailable ? (
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                window.location.href = getOAuthUrl();
              }}
            >
              Sign in with Kimi
            </Button>
          ) : (
            <div className="text-sm text-center text-muted-foreground">
              Kimi OAuth is not configured. Please set VITE_KIMI_AUTH_URL and VITE_APP_ID in your .env.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
