import React from 'react';

export default function SocialAdContainer() {
  const iframeSrcDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: transparent;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div id="container-ec5091ffca720fc9f2a71b8664b338a9"></div>
  <script async data-cfasync="false" src="https://pl30741063.effectivecpmnetwork.com/ec5091ffca720fc9f2a71b8664b338a9/invoke.js"></script>
</body>
</html>`;

  return (
    <div 
      style={{ 
        width: '100%', 
        margin: '10px auto', 
        minHeight: '80px',
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '8px',
        overflow: 'hidden'
      }} 
    >
      <iframe
        title="Social Ad Native"
        srcDoc={iframeSrcDoc}
        width="100%"
        height="80"
        style={{ border: 'none', width: '100%', height: '80px', display: 'block' }}
        scrolling="no"
      />
    </div>
  );
}

