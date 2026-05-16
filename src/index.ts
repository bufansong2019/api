import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { success } from "./shared/response";
import { requestCount } from "./middleware/requestCount";
import api from "./routes/api";
import authRoutes from "./routes/api/auth";
import fishbyte from "./routes/api/fishbyte";
import admin from "./routes/admin";

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use("/api/*", cors());
app.use("/api/*", requestCount);

app.get("/", (c) => success(c, { admin: "/admin/login" }, "FishByte API"));
app.get("/admin", (c) => c.redirect("/admin/dashboard", 302));
app.get("/admin/", (c) => c.redirect("/admin/dashboard", 302));

app.route("/api", api);
app.route("/api/fishbyte", fishbyte);
app.route("/api/auth", authRoutes);
app.route("/admin", admin);

export default app;
