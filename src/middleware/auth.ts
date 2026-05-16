import { drizzle } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import { apiKeys } from "../db/schema";
import { type Context, type Next } from "hono";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { fail } from "../shared/response";

export interface AuthUser {
	type: "api_key" | "jwt";
	keyName?: string;
	userId?: number;
	username?: string;
	role?: string;
}

declare module "hono" {
	interface ContextVariableMap {
		user: AuthUser;
	}
}

async function verifyToken(token: string, env: Env): Promise<AuthUser | null> {
	// 1. 全局 Master Key
	if (token === env.API_KEY) {
		return { type: "api_key", keyName: "Master Key" };
	}

	// 2. 检查 DB 中的项目 Key
	try {
		const row = await drizzle(env.DB)
			.select({ name: apiKeys.name })
			.from(apiKeys)
			.where(and(eq(apiKeys.key, token), eq(apiKeys.enabled, 1)))
			.get();

		if (row) {
			return { type: "api_key", keyName: "API Key（" + row.name + "）" };
		}
	} catch {
		// 表不存在或查询失败，跳过
	}

	// 3. JWT
	try {
		const payload = await verify(token, env.JWT_SECRET, "HS256");
		return {
			type: "jwt",
			userId: payload.sub as number,
			username: payload.username as string,
			role: payload.role as string,
		};
	} catch {
		return null;
	}
}

export async function authGuard(c: Context, next: Next) {
	const token =
		c.req.header("Authorization")?.replace("Bearer ", "") ||
		getCookie(c, "admin_session");

	if (token) {
		const user = await verifyToken(token, c.env);
		if (user) {
			c.set("user", user);
			return next();
		}
	}

	return fail(c, "未登录或登录已过期", 401);
}

export async function adminGuard(c: Context, next: Next) {
	const token =
		c.req.header("Authorization")?.replace("Bearer ", "") ||
		getCookie(c, "admin_session");

	if (token) {
		const user = await verifyToken(token, c.env);
		if (user && (user.type === "api_key" || user.role === "admin")) {
			c.set("user", user);
			return next();
		}
	}

	// 表单提交跳转登录页，API 返回 JSON
	const accept = c.req.header("Accept") || "";
	if (accept.includes("text/html")) {
		return c.redirect("/admin/login", 302);
	}
	return fail(c, "无权限访问", 403);
}

export function generateApiKey(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}
