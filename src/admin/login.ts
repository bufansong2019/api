export function loginPage(error?: string): string {
	const errHtml = error ? `<div class="alert-error">${error}</div>` : "";
	return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script>(function(){var t;try{t=localStorage.getItem("theme")}catch(e){}document.documentElement.setAttribute("data-theme",t||(window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"))})();</script>
  <title>登录 Admin</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
  <style>
    .tab-bar { display: flex; gap: 0; border-bottom: 2px solid var(--pico-muted-border-color); margin-bottom: var(--pico-spacing); }
    .tab-btn { background: none; border: none; padding: var(--pico-spacing) var(--pico-spacing); cursor: pointer; color: var(--pico-muted-color); font-weight: 600; border-bottom: 2px solid transparent; margin-bottom: -2px; font-size: 1rem; }
    .tab-btn.active { color: var(--pico-primary); border-bottom-color: var(--pico-primary); }
    .tab-pane { display: none; }
    .alert-error { background:#fde8e8; color:#c62828; padding:0.75rem; border-radius:6px; font-weight:600; text-align:center; margin-bottom:1rem; }
    [data-theme="dark"] .alert-error { background:#3d1a1a; color:#f8b4b4; border:1px solid #c62828; }
    .tab-pane.active { display: block; }
  </style>
</head>
<body>
  <main class="container">
    <article>
      <hgroup>
        <h1>API</h1>
        <p>登录管理后台</p>
      </hgroup>
      ${errHtml}
      <div class="tab-bar" role="tablist">
        <button class="tab-btn active" data-tab="account">账号密码</button>
        <button class="tab-btn" data-tab="apikey">API Key</button>
      </div>
      <form method="POST" action="/admin/login" id="login-form">
        <div class="tab-pane active" id="tab-account">
          <input type="text" name="username" placeholder="用户名" autocomplete="username">
          <input type="password" name="password" placeholder="密码" autocomplete="current-password">
        </div>
        <div class="tab-pane" id="tab-apikey">
          <input type="password" name="key" placeholder="API Key">
        </div>
        <button type="submit">登录</button>
      </form>
    </article>
  </main>
  <script>
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        document.querySelectorAll('#login-form input').forEach(i => i.required = false);
        document.querySelectorAll('#tab-' + btn.dataset.tab + ' input').forEach(i => i.required = true);
      });
    });
  </script>
</body>
</html>`;
}
