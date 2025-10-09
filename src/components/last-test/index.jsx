import React from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Last Test 위젯
 * 최종 테스트용 컴포넌트
 */
function LastTest() {
  return (
    <div style={{
      width: '100%',
      minHeight: '300px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{
        color: 'white',
        fontSize: '3rem',
        fontWeight: 'bold',
        margin: 0,
        marginBottom: '1rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textShadow: '0 2px 10px rgba(0,0,0,0.2)'
      }}>
        Last Test
      </h1>
      <p style={{
        color: 'rgba(255,255,255,0.9)',
        fontSize: '1.2rem',
        margin: 0,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        🚀 최종 테스트 컴포넌트입니다
      </p>
    </div>
  );
}

// 마운트
const rootElement = document.getElementById('last-test-root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<LastTest />);
}

