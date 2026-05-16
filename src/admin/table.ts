import { layout } from "./layout";
import { renderPagination } from "./pagination";

export interface ColumnInfo {
	cid: number;
	name: string;
	type: string;
	notnull: number;
	pk: number;
}

function esc(s: string): string { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

function maskKey(key: string): string {
	return key.slice(0, 4) + "**********" + key.slice(-4);
}

export function tablePage(tableName: string, columns: ColumnInfo[], rows: Record<string, unknown>[], page: number, total: number, filters: Record<string, string>, pkName: string, username?: string): string {
	const displayCols = columns.filter((c) => c.name !== "rowid");
	const headers = displayCols.map((c) => `<th>${c.name}</th>`).join("") + "<th>操作</th>";
	const isApiKeys = tableName === "api_keys";
	const body = rows
		.map(
			(r) =>
				`<tr>${displayCols.map((c) => {
					let val = r[c.name];
					if (isApiKeys && c.name === "key" && val != null) {
						val = maskKey(String(val));
					}
					return `<td class="mono">${val ?? "<span>NULL</span>"}</td>`;
				}).join("")}<td><form method="POST" action="/admin/tables/${tableName}/delete-row" style="display:inline" onsubmit="return confirm('确定要删除该行吗？')"><input type="hidden" name="pkName" value="${pkName}"><input type="hidden" name="pkValue" value="${r[pkName]}"><button type="submit" class="outline secondary" style="width:auto;margin-bottom:0;font-size:0.8rem">删除</button></form></td></tr>`,
		)
		.join("");

	const totalPages = Math.max(1, Math.ceil(total / 10));
	const filterStr = Object.entries(filters).filter(([,v])=>v).map(([k,v])=>"&"+encodeURIComponent(k)+"="+encodeURIComponent(v)).join("");
	const pagination = renderPagination(page, totalPages, (p) => `/admin/tables/${tableName}?page=${p}${filterStr}#table-section`);

	const filterFields = displayCols.map((c) =>
		'<input type="text" name="'+c.name+'" value="'+esc(filters[c.name]||"")+'" placeholder="'+c.name+'..." style="margin:0;padding:0.25rem 0.5rem;font-size:0.85rem;flex:1;min-width:120px">'
	).join("");

	const filterBar = filterFields ? `
		<form method="GET" action="/admin/tables/${tableName}" style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;margin-bottom:1rem">
		  ${filterFields}
		  <button type="submit" style="width:auto;margin:0">筛选</button>
		  <a href="/admin/tables/${tableName}" role="button" class="outline secondary" style="width:auto;margin:0">清除</a>
		</form>` : "";

	return layout(
		`${tableName} - 仪表盘`,
		`
		${filterBar}
		<nav>
		  <ul><li><a href="/admin/dashboard">&larr; 仪表盘</a></li></ul>
		  <ul><li><strong>${tableName}</strong></li></ul>
		</nav>
		<figure id="table-section">
		  <table>
		    <thead><tr>${headers}</tr></thead>
		    <tbody>${body || "<tr><td colspan='" + (displayCols.length + 1) + "'>暂无数据</td></tr>"}</tbody>
		  </table>
		</figure>
		${pagination}`,
		username,
	);
}
