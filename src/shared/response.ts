import type { Context } from "hono";

export function success<T = unknown>(c: Context, data: T, message = "ok") {
  return c.json({ code: 200, message, data });
}

export function fail(c: Context, message: string, status: number = 400) {
  return c.json({ code: status, message, data: null }, status as any);
}
