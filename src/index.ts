import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import api from "./routes/api";
import authRoutes from "./routes/api/auth";
import proxy from "./routes/api/proxyRednote";
import admin from "./routes/admin";

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use("/api/*", cors());

app.get("/", (c) => c.json({ status: "ok", message: "FishByte API. Admin: /admin/login" }));
app.get("/admin", (c) => c.redirect("/admin/dashboard", 302));
app.get("/admin/", (c) => c.redirect("/admin/dashboard", 302));

app.route("/api", api);
app.route("/api", proxy);
app.route("/api/auth", authRoutes);
app.route("/admin", admin);

export default app;
