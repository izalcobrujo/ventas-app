<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#1A3353" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Ventas" />
  <meta name="description" content="Registro de ventas y gastos diarios por sucursal" />
  <link rel="manifest" href="manifest.json" />
  <link rel="apple-touch-icon" href="icon-192.png" />
  <title>Ventas</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #F4F2EF; font-family: 'DM Sans', 'Segoe UI', sans-serif; overscroll-behavior: none; }
    #root { min-height: 100dvh; }
    #splash {
      position: fixed; inset: 0; background: #1A3353;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      z-index: 9999; transition: opacity .4s;
    }
    #splash.hidden { opacity: 0; pointer-events: none; }
    #splash-icon { width: 72px; height: 72px; background: rgba(255,255,255,.12); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
    #splash-title { font-size: 32px; font-weight: 900; color: white; letter-spacing: -1px; font-family: 'DM Sans', sans-serif; }
    #splash-sub { font-size: 13px; color: rgba(255,255,255,.5); margin-top: 6px; font-weight: 500; font-family: 'DM Sans', sans-serif; }
    #splash-dot { width: 8px; height: 8px; background: #2563EB; border-radius: 99px; margin-top: 40px; animation: pulse 1.2s infinite; }
    @keyframes pulse { 0%,100%{opacity:.3}50%{opacity:1} }
  </style>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
</head>
<body>
  <div id="splash">
    <div id="splash-icon">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    </div>
    <div id="splash-title">Ventas</div>
    <div id="splash-sub">Registro diario de ventas y gastos</div>
    <div id="splash-dot"></div>
  </div>

  <div id="root"></div>

  <!-- React UMD — igual que en la app de Adelantos -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <!-- La app: Babel la transpila en el navegador, igual que Adelantos -->
  <script type="text/babel" src="ventas-app.jsx" data-presets="react" data-type="module"></script>

  <script>
    // Babel llama a __onBabelTranspiled cuando termina. Lo usamos para montar.
    // Como alternativa segura: esperamos a que App esté definido en window.
    function mountApp() {
      if (typeof App === 'undefined') {
        setTimeout(mountApp, 50);
        return;
      }
      try {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));
      } catch(e) {
        console.error('Mount error:', e);
      }
      // Ocultar splash
      setTimeout(() => {
        const splash = document.getElementById('splash');
        if (splash) {
          splash.classList.add('hidden');
          setTimeout(() => splash.remove(), 400);
        }
      }, 600);
    }

    window.addEventListener('load', () => {
      // Darle tiempo a Babel para transpilar el JSX
      setTimeout(mountApp, 200);

      // Service Worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      }
    });
  </script>
</body>
</html>
