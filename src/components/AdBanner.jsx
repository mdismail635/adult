import React from 'react';

export default function AdBanner({ bannerKey, width = 468, height = 60 }) {
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
  <script type="text/javascript">
    atOptions = {
      'key' : '${bannerKey}',
      'format' : 'iframe',
      'height' : ${height},
      'width' : ${width},
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="https://www.highperformanceformat.com/${bannerKey}/invoke.js"></script>
</body>
</html>`;

  return (
    <div 
      className="ad-banner-wrapper"
      style={{ 
        width: '100%',
        maxWidth: `${width}px`, 
        height: `${height}px`, 
        margin: '0 auto', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative'
      }} 
    >
      <iframe
        title={`CPM Banner ${bannerKey}`}
        srcDoc={iframeSrcDoc}
        width={width}
        height={height}
        style={{
          border: 'none',
          overflow: 'hidden',
          width: '100%',
          height: `${height}px`,
          maxWidth: `${width}px`,
          display: 'block'
        }}
        scrolling="no"
      />
    </div>
  );
}

