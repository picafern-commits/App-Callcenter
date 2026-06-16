<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bragalis Callcenter</title>
  <script>
    (function(){
      try{
        var theme=localStorage.getItem('bragalis_user_theme_v1');
        var res=localStorage.getItem('bragalis_resolution_v1') || 'standard';
        var scheme=localStorage.getItem('bragalis_color_scheme_v1') || 'az';
        if(theme==='dark') document.documentElement.classList.add('theme-dark');
        document.documentElement.classList.add('res-'+res);
        document.documentElement.classList.add('scheme-'+scheme);
      }catch(e){}
    })();
  </script>
  <link rel="stylesheet" href="../css/styles.css" />
  <link rel="icon" href="../assets/bragalis-callcenter-icon.png">
</head>
<body class="auth-boot">
  <div id="loginScreen" class="login-screen">
    <div class="login-card glass">
      <div class="brand-mark">BC</div>
      <h1>Bragalis Callcenter</h1>
      <p>Gestão profissional do Callcenter Bragalis.</p>
      <label>Email</label>
      <input id="loginEmail" type="email" placeholder="admin@empresa.pt" autocomplete="email" />
      <label>Password</label>
      <input id="loginPassword" type="password" placeholder="••••••••" autocomplete="current-password" />
      <label class="checkline"><input id="rememberLogin" type="checkbox" /> Memorizar email</label>
      <button id="loginBtn" class="btn primary full">Entrar</button>
      <small>Demo local: qualquer email e password entram. Preparado para trocar por Firebase Auth.</small>
    </div>
  </div>

  <div id="appShell" class="app-shell hidden">
    <header class="shell-header">
      <div class="header-brand">
        <div class="brand-mark small">BC</div>
        <div>
          <strong>Bragalis</strong>
          <span>CallCenter</span>
        </div>
      </div>

      <div class="header-copy">
        <h2 id="pageTitle">Dashboard</h2>
        <span id="pageSubtitle">Central de controlo do callcenter</span>
      </div>

      <div class="top-actions">
        <button id="homeBtn" class="btn ghost">Início</button>
        <button id="quickCallBtn" class="btn primary">+ Nova chamada</button>
        <span id="userBadge" class="user-badge">Admin</span>
        <button id="logoutBtn" class="btn danger-soft">Fechar app</button>
      </div>
    </header>

    <div class="nav-strip-wrap">
      <nav id="navMenu" class="nav-strip"></nav>
    </div>

    <main class="main">
      <section id="pageContent" class="content"></section>
    </main>
  </div>

  <div id="modalRoot" class="modal-root hidden"></div>
  <div id="toast" class="toast hidden"></div>

  <script>window.DEFAULT_PAGE = 'stock';</script>
  <script src="../js/app.js"></script>
</body>
</html>
