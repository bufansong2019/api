import { Hono } from "hono";
import { authGuard } from "../../../middleware/auth";
import { fail } from "../../../shared/response";

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

proxy.get("/proxyDownload", authGuard, async (c) => {
  const urlStr = c.req.query("url");
  if (!urlStr) {
    return fail(c, "缺少url参数", 400);
  }

  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    return fail(c, "无效的URL", 400);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return fail(c, "只允许http和https链接", 400);
  }

  if (isInternalHost(url.hostname)) {
    return fail(c, "不允许访问内网地址", 400);
  }

  try {
    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(30000),
    });

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
    return fail(c, "获取目标地址失败", 502);
  }
});

export default proxy;
