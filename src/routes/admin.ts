import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, desc, sql } from "drizzle-orm";
import { localTime, base64Url, hashPassword } from "../shared/utils";
import { users, apiKeys, activityLogs, requestStats } from "../db/schema";
import { adminGuard, generateApiKey } from "../middleware/auth";
import { loginPage } from "../admin/login";
import { homePage } from "../admin/home";
import { dashboard } from "../admin/dashboard";
import { tablePage } from "../admin/table";
import { apiKeysPage } from "../admin/api-keys";
import { usersPage } from "../admin/users";

const admin = new Hono<{ Bindings: Env }>();

// 显示后台登录页面
admin.get("/login", (c) => c.html(loginPage()));

// 处理后台登录（支持账号密码 / API Key 两种方式）
admin.post("/login", async (c) => {
	const body = await c.req.parseBody<{ key?: string; username?: string; password?: string }>();

	try {
		// 账号密码登录
		if (body.username && body.password) {
			const row = await drizzle(c.env.DB)
				.select()
				.from(users)
				.where(eq(users.username, body.username))
				.get();

			if (row) {
				const pwHash = await hashPassword(body.password, row.passwordSalt);
				if (pwHash === row.passwordHash) {
					const token = await sign({ sub: 0, username: row.username, role: "admin", exp: Math.floor(Date.now() / 1000) + 28800 }, c.env.JWT_SECRET, "HS256");
					setCookie(c, "admin_session", token, {
						path: "/admin",
						httpOnly: true,
						secure: false,
						sameSite: "Lax",
						maxAge: 28800,
					});
					await drizzle(c.env.DB).insert(activityLogs).values({ user: body.username, action: "登录后台", createdAt: localTime() }).run();
					return c.redirect("/admin/home", 302);
				}
			}
		}

		// API Key 登录 — 同时查全局 Key 和 DB 项目 Key
		if (body.key) {
			let keyName;
			if (body.key === c.env.API_KEY) {
				keyName = "Master Key";
			} else {
				const row = await drizzle(c.env.DB).select({ name: apiKeys.name }).from(apiKeys).where(and(eq(apiKeys.key, body.key), eq(apiKeys.enabled, 1))).get();
				if (!row) { keyName = ""; } else { keyName = "API Key（" + row.name + "）"; }
			}
			if (keyName) {
				const token = await sign({ sub: 0, username: keyName, role: "admin", exp: Math.floor(Date.now() / 1000) + 28800 }, c.env.JWT_SECRET, "HS256");
				setCookie(c, "admin_session", token, {
					path: "/admin",
					httpOnly: true,
					secure: false,
					sameSite: "Lax",
					maxAge: 28800,
				});
				await drizzle(c.env.DB).insert(activityLogs).values({ user: keyName, action: "登录后台", createdAt: localTime() }).run();
				return c.redirect("/admin/home", 302);
			}
		}

		await drizzle(c.env.DB).insert(activityLogs).values({ user: body.username || "未知", action: "登录后台", status: "失败", createdAt: localTime() }).run();
			await new Promise(r => setTimeout(r, 2000)); return c.html(loginPage("用户名、密码或 API Key 不正确"));
	} catch (e) {
		await drizzle(c.env.DB).insert(activityLogs).values({ user: (body && body.username) || "未知", action: "登录后台", status: "失败", createdAt: localTime() }).run();
			await new Promise(r => setTimeout(r, 2000)); return c.html(loginPage(`登录失败: ${e instanceof Error ? e.message : "未知错误"}`));
	}
});

// 退出后台，清除 session cookie
admin.get("/logout", (c) => {
	deleteCookie(c, "admin_session", { path: "/admin" });
	return c.redirect("/admin/login", 302);
});

// 后台首页：展示欢迎信息、统计卡片、最近操作日志
admin.get("/home", adminGuard, async (c) => {
	const user = c.get("user");
	const page = Math.max(1, Number(c.req.query("page")) || 1);
	const limit = 10;
	const offset = (page - 1) * limit;

	const db = drizzle(c.env.DB);
	const logs = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit).offset(offset).all();
	const totalResult = await db.select({ count: sql<number>`count(*)` }).from(activityLogs);
	const total = Number(totalResult[0]?.count) || 0;

		const activeKeysResult = await db.select({ count: sql<number>`count(*)` }).from(apiKeys).where(eq(apiKeys.enabled, 1));
		const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users);
		const totalRequestsResult = await db.select({ total: sql<number>`COALESCE(SUM(count), 0)` }).from(requestStats);
		const activeKeys = Number(activeKeysResult[0]?.count) || 0;
		const totalUsers = Number(totalUsersResult[0]?.count) || 0;
		const totalRequests = Number(totalRequestsResult[0]?.total) || 0;

		return c.html(homePage(user.username || user.keyName || "Admin", logs, total, page, limit, activeKeys, totalUsers, totalRequests));
});

// 控制台：数据库概览 + 请求统计
admin.get("/dashboard", adminGuard, async (c) => {
	try {
		const tables = await c.env.DB.prepare("PRAGMA table_list").all<{ name: string }>();
		const userTables = tables.results.filter(
			(t) => !t.name.startsWith("sqlite_") && !t.name.startsWith("_cf_") && t.name !== "d1_migrations",
		);

		const stats = [];
		for (const t of userTables) {
			try {
				const row = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM "${t.name}"`).first<{ count: number }>();
				stats.push({ name: t.name, rowCount: row?.count ?? 0 });
			} catch {
				stats.push({ name: t.name, rowCount: -1 });
			}
		}

		// 请求统计
		const db = drizzle(c.env.DB);
		const today = new Date().toISOString().slice(0, 10);
		const totalRow = await db.select({ total: sql`COALESCE(SUM(count), 0)` }).from(requestStats).get();
		const todayRow = await db.select({ total: sql`COALESCE(SUM(count), 0)` }).from(requestStats).where(eq(requestStats.date, today)).get();
		const allTimePaths = await db.select({ path: requestStats.path, count: sql<number>`SUM(${requestStats.count})` }).from(requestStats).groupBy(requestStats.path).orderBy(desc(sql`SUM(${requestStats.count})`)).limit(7).all();
		const todayPaths = await db.select({ path: requestStats.path, count: requestStats.count }).from(requestStats).where(eq(requestStats.date, today)).orderBy(desc(requestStats.count)).limit(7).all();

		return c.html(dashboard(
			stats,
			c.get("user").username || c.get("user").keyName,
			Number(totalRow?.total) || 0,
			Number(todayRow?.total) || 0,
			allTimePaths || [],
			todayPaths || [],
		));
	} catch (e) {
		return c.text(`Error: ${e instanceof Error ? e.message : String(e)}`, 500);
	}
});

// API 密钥列表（分页）
admin.get("/api-keys", adminGuard, async (c) => {
	try {
		const page = Math.max(1, Number(c.req.query("page")) || 1);
		const limit = 5;
		const offset = (page - 1) * limit;
		const keys = await drizzle(c.env.DB)
			.select()
			.from(apiKeys)
			.orderBy(desc(apiKeys.createdAt))
			.limit(limit).offset(offset)
			.all();
		const countResult = await drizzle(c.env.DB).select({ count: sql<number>`count(*)` }).from(apiKeys);
		const total = Number(countResult[0]?.count) || 0;
		return c.html(apiKeysPage(keys, c.req.query("new") || undefined, page, total, c.get("user").username || c.get("user").keyName));
	} catch {
		return c.html(apiKeysPage([], undefined, 1, 0));
	}
});

// 创建新的 API 密钥
admin.post("/api-keys", adminGuard, async (c) => {
	const fd = await c.req.formData();
	const name = fd.get("name")?.toString().trim();
	if (!name) return c.redirect("/admin/api-keys", 302);

	const newKey = generateApiKey();
	await drizzle(c.env.DB).insert(apiKeys).values({ key: newKey, name, createdAt: localTime() }).run();
	await drizzle(c.env.DB).insert(activityLogs).values({ user: c.get("user").username || c.get("user").keyName || "未知", action: "创建 API 密钥", createdAt: localTime() }).run();

	return c.redirect(`/admin/api-keys?page=1&new=${newKey}`, 302);
});

// 启用/禁用 API 密钥
admin.post("/api-keys/:id/toggle", adminGuard, async (c) => {
	const id = Number(c.req.param("id")!);
	const existing = await drizzle(c.env.DB)
		.select({ enabled: apiKeys.enabled })
		.from(apiKeys)
		.where(eq(apiKeys.id, id))
		.get();

	if (existing) {
		await drizzle(c.env.DB)
			.update(apiKeys)
			.set({ enabled: existing.enabled ? 0 : 1 })
			.where(eq(apiKeys.id, id))
			.run();
		await drizzle(c.env.DB).insert(activityLogs).values({ user: c.get("user").username || c.get("user").keyName || "未知", action: existing.enabled ? "禁用密钥" : "启用密钥", createdAt: localTime() }).run();
	}
	return c.redirect("/admin/api-keys", 302);
});

// 删除 API 密钥
admin.post("/api-keys/:id/delete", adminGuard, async (c) => {
	const id = Number(c.req.param("id")!);
	await drizzle(c.env.DB).delete(apiKeys).where(eq(apiKeys.id, id)).run();
	await drizzle(c.env.DB).insert(activityLogs).values({ user: c.get("user").username || c.get("user").keyName || "未知", action: "删除 API 密钥", createdAt: localTime() }).run();
	return c.redirect("/admin/api-keys", 302);
});

// 用户管理列表（分页）
admin.get("/users", adminGuard, async (c) => {
	try {
		const page = Math.max(1, Number(c.req.query("page")) || 1);
		const limit = 10;
		const offset = (page - 1) * limit;

		const db = drizzle(c.env.DB);
		const userList = await db.select({ id: users.id, username: users.username, role: users.role, createdAt: users.createdAt })
			.from(users)
			.orderBy(desc(users.createdAt))
			.limit(limit).offset(offset)
			.all();
		const countResult = await db.select({ count: sql<number>`count(*)` }).from(users);
		const total = Number(countResult[0]?.count) || 0;
		const newUsername = c.req.query("new");
		return c.html(usersPage(userList, page, total, c.get("user").username || c.get("user").keyName, undefined, newUsername));
	} catch {
		return c.html(usersPage([], 1, 0));
	}
});

// 创建新用户（支持选择角色）
admin.post("/users", adminGuard, async (c) => {
	const fd = await c.req.formData();
	const username = fd.get("username")?.toString().trim();
	const password = fd.get("password")?.toString();
	const role = fd.get("role")?.toString() || "user";

	if (!username || !password) return c.html(usersPage([], 1, 0, undefined, "用户名和密码不能为空"));
	if (password.length < 6) return c.html(usersPage([], 1, 0, undefined, "密码至少需要6位"));

	const salt = base64Url(crypto.getRandomValues(new Uint8Array(16)).reduce((s, b) => s + String.fromCharCode(b), ""));
	const passwordHash = await hashPassword(password, salt);

	try {
		await drizzle(c.env.DB).insert(users).values({ username, passwordHash, passwordSalt: salt, role, createdAt: localTime() }).run();
		await drizzle(c.env.DB).insert(activityLogs).values({ user: c.get("user").username || c.get("user").keyName || "未知", action: "创建用户：" + username, createdAt: localTime() }).run();
		return c.redirect(`/admin/users?new=${encodeURIComponent(username)}`, 302);
	} catch {
		return c.html(usersPage([], 1, 0, undefined, "用户名已存在"));
	}
});

// 删除用户
admin.post("/users/:id/delete", adminGuard, async (c) => {
	const id = Number(c.req.param("id")!);
	await drizzle(c.env.DB).delete(users).where(eq(users.id, id)).run();
	await drizzle(c.env.DB).insert(activityLogs).values({ user: c.get("user").username || c.get("user").keyName || "未知", action: "删除用户 ID：" + id, createdAt: localTime() }).run();
	return c.redirect("/admin/users", 302);
});

// 查看表数据（支持分页、多列模糊筛选）
admin.get("/tables/:name", adminGuard, async (c) => {
	const tableName = c.req.param("name")!;
	const page = Math.max(1, Number(c.req.query("page")) || 1);
	const limit = 10;
	const offset = (page - 1) * limit;

	const cols = await c.env.DB.prepare(`PRAGMA table_info("${tableName}")`).all<{
		cid: number;
		name: string;
		type: string;
		notnull: number;
		pk: number;
	}>();
	if (cols.results.length === 0) {
		return c.redirect("/admin/dashboard", 302);
	}

	// extract filters from query params
	const queries = c.req.queries();
	const validCols = new Set(cols.results.map((c) => c.name));
	const filters: Record<string, string> = {};
	for (const key in queries) {
		if (key !== "page" && validCols.has(key) && queries[key][0]) {
			filters[key] = queries[key][0];
		}
	}

	// build WHERE clause
	const filterKeys = Object.keys(filters);
	const whereClause = filterKeys.length > 0
		? " WHERE " + filterKeys.map((k) => `"${k}" LIKE ?`).join(" AND ")
		: "";
	const bindValues = Object.values(filters).map((v) => `%${v}%`);

	const pkCol = cols.results.find((c) => c.pk > 0) || cols.results[0];
	const pkName = pkCol.name;

	const countResult = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM "${tableName}"${whereClause}`).bind(...bindValues).first<{ count: number }>();
	const total = countResult?.count || 0;

	const rows = await c.env.DB.prepare(`SELECT * FROM "${tableName}"${whereClause} ORDER BY "${pkName}" DESC LIMIT ? OFFSET ?`).bind(...bindValues, limit, offset).all<Record<string, unknown>>();

	return c.html(tablePage(tableName, cols.results, rows.results, page, total, filters, pkName, c.get("user").username || c.get("user").keyName));
});


// 删除指定表的某行数据
admin.post("/tables/:name/delete-row", adminGuard, async (c) => {
	const fd = await c.req.formData();
	const pkName = fd.get("pkName")?.toString();
	const pkValue = fd.get("pkValue")?.toString();
	if (!pkName || !pkValue) return c.redirect(c.req.header("Referer") || "/admin/dashboard", 302);
	await c.env.DB.prepare(`DELETE FROM "${c.req.param('name')}" WHERE "${pkName}" = ?`).bind(Number(pkValue)).run();
	await drizzle(c.env.DB).insert(activityLogs).values({ user: c.get("user").username || c.get("user").keyName || "未知", action: `删除 ${c.req.param('name')} 表数据`, createdAt: localTime() }).run();
	return c.redirect(c.req.header("Referer") || "/admin/dashboard", 302);
});

export default admin;
