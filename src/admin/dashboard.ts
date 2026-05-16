import { layout } from "./layout";

export interface TableInfo {
  name: string;
  rowCount: number;
}

export interface TopPath {
  path: string;
  count: number;
}

export function dashboard(
  tables: TableInfo[],
  username?: string,
  totalRequests: number = 0,
  todayRequests: number = 0,
  topPaths: TopPath[] = [],
  todayTopPaths: TopPath[] = [],
): string {
  const cards = tables
    .map(
      (t) => `
      <article>
        <header><strong><a href="/admin/tables/${t.name}">${t.name}</a></strong></header>
        <div>${t.rowCount} 行</div>
      </article>`,
    )
    .join("");

  // 合并全部和今日数据
  const pathMap = new Map<string, { all: number; today: number }>();
  for (const p of topPaths) pathMap.set(p.path, { all: p.count, today: 0 });
  for (const p of todayTopPaths) {
    const existing = pathMap.get(p.path);
    if (existing) existing.today = p.count;
    else pathMap.set(p.path, { all: 0, today: p.count });
  }
  const merged = [...pathMap.entries()].sort((a, b) => b[1].all - a[1].all);

  const rows = merged.length
    ? merged.map(([path, counts], i) => `
      <tr><td>${i + 1}</td><td><code>${path}</code></td><td style="text-align:right">${counts.all.toLocaleString()}</td><td style="text-align:right">${counts.today.toLocaleString()}</td></tr>`).join("")
    : "<tr><td colspan='4'>暂无数据</td></tr>";

  return layout(
    "控制台",
    `
    <h1>仪表盘</h1>

    <p>总请求数 <strong>${totalRequests.toLocaleString()}</strong> &ensp;|&ensp; 今日 <strong>${todayRequests.toLocaleString()}</strong></p>

    <article style="margin-bottom:2rem">
      <header><strong>接口请求统计</strong></header>
      <table>
        <thead><tr><th>#</th><th>接口</th><th style="text-align:right">全部调用次数</th><th style="text-align:right">今日调用次数</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </article>

    <article>
      <header><strong>数据库概览</strong></header>
      <div class="card-grid">${cards || "<p>暂无数据表</p>"}</div>
    </article>`,
    username,
  );
}
