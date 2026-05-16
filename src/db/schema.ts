import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	username: text("username").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	passwordSalt: text("password_salt").notNull(),
	role: text("role").notNull().default("user"),
	createdAt: text("created_at").notNull().default("datetime('now')"),
});

export const apiKeys = sqliteTable("api_keys", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	key: text("key").notNull().unique(),
	name: text("name").notNull(),
	enabled: integer("enabled").notNull().default(1),
	createdAt: text("created_at").notNull().default("datetime('now')"),
});

export const requestStats = sqliteTable("request_stats", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	date: text("date").notNull(),
	path: text("path").notNull(),
	count: integer("count").notNull().default(1),
}, (t) => ({
	uniqueDatePath: unique().on(t.date, t.path),
}));

export const activityLogs = sqliteTable("activity_logs", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	user: text("user").notNull(),
	action: text("action").notNull(),
	status: text("status").notNull().default("成功"),
	createdAt: text("created_at").notNull().default("datetime('now')"),
});
