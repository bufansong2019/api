import { layout, escapeHtml } from "./layout";
import { renderPagination } from "./pagination";

export interface ActivityLogRow {
	id: number;
	user: string;
	action: string;
	status: string;
	createdAt: string;
}

export function homePage(username: string, logs: ActivityLogRow[], total: number, page: number, limit: number, activeKeys: number, totalUsers: number, totalRequests: number = 0): string {
	const logRows = logs
		.map(
			(l) => `
		    <tr><td>${l.createdAt}</td><td>${escapeHtml(l.user)}</td><td>${escapeHtml(l.action)}</td><td><span class="badge ${l.status === "成功" ? "badge-green" : "badge-red"}">${escapeHtml(l.status)}</span></td></tr>`,
		)
		.join("");

	const totalPages = Math.max(1, Math.ceil(total / limit));
	const pagination = renderPagination(page, totalPages, (p) => `/admin/home?page=${p}#log-section`);

	return layout(
		"首页",
		`
	    <div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding-top:3rem">
	      <h1>欢迎回来，${username}</h1>
	      <p id="clock" style="font-size:2rem;margin-top:1rem"></p>
	    </div>
	    <div class="grid" style="margin-top:3rem">
	      <article><header>总请求数</header><p style="font-size:2rem;font-weight:700;text-align:center">${totalRequests.toLocaleString()}</p></article>
	      <article><header>活跃密钥</header><p style="font-size:2rem;font-weight:700;text-align:center">${activeKeys}</p></article>
	      <article><header>注册用户</header><p style="font-size:2rem;font-weight:700;text-align:center">${totalUsers}</p></article>
	    </div>
	    <article id="log-section" style="margin-top:2rem">
	      <header><strong>最近操作日志</strong></header>
	      <table>
	        <colgroup>
	          <col style="width:30%">
	          <col style="width:25%">
	          <col style="width:25%">
	          <col style="width:20%">
	        </colgroup>
	        <thead><tr><th>时间</th><th>用户</th><th>操作</th><th>状态</th></tr></thead>
	        <tbody>${logRows || "<tr><td colspan='4'>暂无日志</td></tr>"}</tbody>
	      </table>
	      ${pagination}
	    </article>
	    <script>
	      function updateClock() {
	        const now = new Date();
	        const opts = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
	        document.getElementById('clock').textContent = now.toLocaleDateString('zh-CN', opts) + ' ' + now.toLocaleTimeString('zh-CN');
	      }
	      updateClock();
	      setInterval(updateClock, 1000);
	    </script>`,
		username,
	);
}
