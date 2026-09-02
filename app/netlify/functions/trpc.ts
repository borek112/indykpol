import app from "../../api/boot";

type NetlifyEvent = {
  httpMethod: string;
  headers: Record<string, string | undefined>;
  body: string | null;
  isBase64Encoded?: boolean;
  rawUrl?: string;
  path: string;
  queryStringParameters?: Record<string, string | undefined> | null;
};

function eventToRequest(event: NetlifyEvent): Request {
  const queryEntries = Object.entries(event.queryStringParameters ?? {}).filter(([, value]) => value != null) as Array<[string, string]>;
  const url = event.rawUrl
    ?? `https://${event.headers.host ?? "localhost"}${event.path}${queryEntries.length > 0 ? `?${new URLSearchParams(queryEntries).toString()}` : ""}`;

  const body = event.body
    ? (event.isBase64Encoded ? Buffer.from(event.body, "base64") : event.body)
    : undefined;

  return new Request(url, {
    method: event.httpMethod,
    headers: new Headers(event.headers as Record<string, string>),
    body: event.httpMethod === "GET" || event.httpMethod === "HEAD" ? undefined : body,
  });
}

export async function handler(event: NetlifyEvent) {
  const response = await app.fetch(eventToRequest(event));
  return {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: await response.text(),
    isBase64Encoded: false,
  };
}
