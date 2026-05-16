import { Hono } from "hono";
import proxy from "./proxyDownload";
import getProvince from "./getProvince";

const fishbyte = new Hono<{ Bindings: Env }>();

fishbyte.route("/", proxy);
fishbyte.route("/", getProvince);

export default fishbyte;
