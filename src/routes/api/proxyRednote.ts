import { Hono } from "hono";
import { authGuard } from "../../middleware/auth";

const proxy = new Hono<{ Bindings: Env }>();

// Internal IP ranges for SSRF protection
const INTERNAL_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^\[::1\]$/,
  /^localhost$/i,
];

function isInternalHost(hostname: string): boolean {
  return INTERNAL_PATTERNS.some((pattern) => pattern.test(hostname));
}

proxy.get("/proxyRednote", authGuard, async (c) => {
  const urlStr = c.req.query("url");
  if (!urlStr) {
    return c.json({ error: "url query parameter is required" }, 400);
  }

  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    return c.json({ error: "Invalid URL" }, 400);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return c.json({ error: "Only http and https URLs are allowed" }, 400);
  }

  if (isInternalHost(url.hostname)) {
    return c.json({ error: "Internal addresses are not allowed" }, 400);
  }

  try {
    const response = await fetch(url.toString());

    // Forward relevant headers
    const headers = new Headers();
    for (const key of ["content-type", "content-disposition", "content-length"]) {
      const val = response.headers.get(key);
      if (val) headers.set(key, val);
    }

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch {
    return c.json({ error: "Failed to fetch the target URL" }, 502);
  }
});

export default proxy;
