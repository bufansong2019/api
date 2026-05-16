import type { Context, Next } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { sql } from "drizzle-orm";
import { requestStats } from "../db/schema";

async function incrementRequestCount(db: D1Database, path: string) {
	const today = new Date().toISOString().slice(0, 10);
	try {
		await drizzle(db)
			.insert(requestStats)
			.values({ date: today, path, count: 1 })
			.onConflictDoUpdate({
				target: [requestStats.date, requestStats.path],
				set: { count: sql`count + 1` },
			})
			.run();
	} catch {
		// 静默失败，不影响接口
	}
}

export async function requestCount(c: Context, next: Next) {
	await next();
	c.executionCtx.waitUntil(incrementRequestCount(c.env.DB, c.req.path));
}
