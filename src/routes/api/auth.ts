import { Hono } from "hono";
import { sign } from "hono/jwt";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { users } from "../../db/schema";
import { authGuard } from "../../middleware/auth";
import { localTime, base64Url, hashPassword } from "../../shared/utils";
import { success, fail } from "../../shared/response";

const authRoutes = new Hono<{ Bindings: Env }>();

// 用户注册（返回 JWT token）
authRoutes.post("/register", async (c) => {
	const { username, password } = await c.req.json<{ username: string; password: string }>();
	if (!username || !password) return fail(c, "用户名和密码不能为空", 400);
	if (password.length < 6) return fail(c, "密码至少需要6位", 400);

	const salt = base64Url(crypto.getRandomValues(new Uint8Array(16)).reduce((s, b) => s + String.fromCharCode(b), ""));
	const passwordHash = await hashPassword(password, salt);

	try {
		await drizzle(c.env.DB).insert(users).values({ username, passwordHash, passwordSalt: salt, createdAt: localTime() }).run();
	} catch {
		return fail(c, "用户名已存在", 409);
	}

	const token = await sign(
		{ sub: 0, username, role: "user", exp: Math.floor(Date.now() / 1000) + 604800 },
		c.env.JWT_SECRET,
		"HS256",
	);

	return success(c, { token, user: { username, role: "user" } });
});

// 用户登录（校验密码，返回 JWT token）
authRoutes.post("/login", async (c) => {
	const { username, password } = await c.req.json<{ username: string; password: string }>();
	if (!username || !password) return fail(c, "用户名和密码不能为空", 400);

	const row = await drizzle(c.env.DB)
		.select()
		.from(users)
		.where(eq(users.username, username))
		.get();

	if (!row) return fail(c, "用户名或密码错误", 401);

	const passwordHash = await hashPassword(password, row.passwordSalt);

	if (passwordHash !== row.passwordHash) return fail(c, "用户名或密码错误", 401);

	const token = await sign(
		{ sub: row.id, username, role: row.role, exp: Math.floor(Date.now() / 1000) + 604800 },
		c.env.JWT_SECRET,
		"HS256",
	);

	return success(c, { token, user: { id: row.id, username, role: row.role } });
});

// 获取当前登录用户信息（需携带 JWT token）
authRoutes.get("/me", authGuard, (c) => {
	const user = c.get("user");
	return success(c, { user });
});

export default authRoutes;
