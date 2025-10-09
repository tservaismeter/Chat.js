import React from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Kaka Haha 위젯
 * 간단한 텍스트를 표시하는 테스트 위젯
 */
function KakaHaha() {
  return (
    <div style={{
      width: '100%',
      minHeight: '200px',
      backgroundColor: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      borderRadius: '8px'
    }}>
      <h1 style={{
        color: 'black',
        fontSize: '3rem',
        fontWeight: 'bold',
        margin: 0,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        kaka haha!
      </h1>
    </div>
  );
}

// 마운트
const rootElement = document.getElementById('kaka-haha-root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<KakaHaha />);
}

