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

  const handleBannerClick = () => {
    try {
      window.open("https://www.effectivecpmnetwork.com/jf5hm6pecw?key=fce7c69f35907acc5fda26e628d9e73f", "_blank");
    } catch (e) {
      console.warn("Direct link click:", e);
    }
  };

  return (
    <div 
      className="ad-banner-wrapper"
      onClick={handleBannerClick}
      title="Click to view sponsored content"
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
        position: 'relative',
        cursor: 'pointer'
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
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals allow-top-navigation-by-user-activation"
        scrolling="no"
      />
    </div>
  );
}

