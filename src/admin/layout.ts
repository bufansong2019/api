export function layout(title: string, content: string, username?: string): string {
	const userBadge = username
		? `<li><span style="color:var(--pico-muted-color);font-size:0.9rem">${username}</span></li>`
		: "";
	return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script>(function(){var t;try{t=localStorage.getItem("theme")}catch(e){}document.documentElement.setAttribute("data-theme",t||(window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"))})();</script>
  <title>${title} Admin</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
  <style>
    body { margin: 0; }
    main.container { padding-bottom: 5rem; }
    footer { position: fixed; bottom: 0; left: 0; right: 0; border-top: 1px solid var(--pico-muted-border-color); }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--pico-spacing); }
    .mono { font-family: ui-monospace, monospace; font-size: 0.875em; }
    .tab-bar { display: flex; gap: 0; border-bottom: 2px solid var(--pico-muted-border-color); margin-bottom: var(--pico-spacing); }
    .tab-btn { background: none; border: none; padding: var(--pico-spacing) var(--pico-spacing); cursor: pointer; color: var(--pico-muted-color); font-weight: 600; border-bottom: 2px solid transparent; margin-bottom: -2px; }
    .tab-btn.active { color: var(--pico-primary); border-bottom-color: var(--pico-primary); }
    .tab-pane { display: none; }
    .tab-pane.active { display: block; }
    .badge { display:inline-block; padding:0.15rem 0.5rem; border-radius:4px; font-size:0.8em; font-weight:600; }
    .badge-green { background:#e6f7e6; color:#2e7d32; }
    .badge-red { background:#fde8e8; color:#c62828; }
    [data-theme="dark"] .badge-green { background:#1a3d1a; color:#b4f8b4; }
    [data-theme="dark"] .badge-red { background:#3d1a1a; color:#f8b4b4; }
    .alert-error { background:#fde8e8; color:#c62828; padding:0.75rem; border-radius:6px; font-weight:600; text-align:center; margin-bottom:1rem; }
    .alert-success { background:#e6f7e6; color:#2e7d32; padding:1rem; border-radius:6px; font-weight:600; text-align:center; margin-bottom:1rem; border:2px solid #2e7d32; }
    [data-theme="dark"] .alert-error { background:#3d1a1a; color:#f8b4b4; border:1px solid #c62828; }
    [data-theme="dark"] .alert-success { background:#1a3d1a; color:#b4f8b4; border:1px solid #4caf50; }
  </style>
</head>
<body>
  <header class="container">
    <nav>
      <ul><li><strong><a href="/admin/home">API 管理后台</a></strong></li></ul>
      <ul>
        <li><a href="/admin/dashboard">控制台</a></li>
        <li><a href="/admin/users">用户管理</a></li>
        <li><a href="/admin/api-keys">API 密钥管理</a></li>
        <li><a href="#" id="theme-toggle">浅色模式</a></li>
        ${userBadge}
        <li><a href="/admin/logout">退出</a></li>
      </ul>
    </nav>
  </header>
  <main class="container">${content}</main>
  <footer style="text-align:center;padding:0.75rem 0;font-size:0.8rem;color:var(--pico-muted-color);background:var(--pico-background-color);z-index:10">
    <p>API 管理后台 &copy; ${new Date().getFullYear()}</p>
  </footer>
  <script>
    const html = document.documentElement;
    const toggle = document.getElementById("theme-toggle");
    const current = html.getAttribute("data-theme");
	    toggle.textContent = current === "dark" ? "深色模式" : "浅色模式";
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
      html.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      toggle.textContent = next === "dark" ? "深色模式" : "浅色模式";
    });
  </script>
</body>
</html>`;
}

export function escapeHtml(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
