import React from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Wow Wow Widget
 * A simple component that displays text
 */
function WowWow() {
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
        Wow Wow
      </h1>
    </div>
  );
}

// Mount
const rootElement = document.getElementById('wowwow-root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<WowWow />);
}

