import { Hono } from "hono";
import { authGuard } from "../../../middleware/auth";
import { success, fail } from "../../../shared/response";

const getProvince = new Hono<{ Bindings: Env }>();

getProvince.get("/getProvince", authGuard, async (c) => {
  const lat = c.req.query("lat");
  const lng = c.req.query("lng");
  if (!lat || !lng) {
    return fail(c, "缺少经纬度参数", 400);
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=zh&zoom=5`;
  const res = await fetch(url, {
    headers: { "User-Agent": "FishByteAPI/1.0" },
  });

  if (!res.ok) {
    return fail(c, "获取位置信息失败", 502);
  }

  const data = await res.json<{ address?: { state?: string; province?: string } }>();
  const rawProvince = data.address?.state || data.address?.province;
  if (!rawProvince) {
    return fail(c, "未找到对应省份", 404);
  }

  const province = rawProvince.replace(/(省|市|自治区)$/, "");
  return success(c, { province });
});

export default getProvince;
