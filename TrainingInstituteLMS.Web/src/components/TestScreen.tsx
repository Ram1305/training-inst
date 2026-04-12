import React from 'react';

export const TestScreen = () => {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: 'white', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <h1 style={{ color: '#333', fontFamily: 'sans-serif' }}>Test Screen</h1>
      <p style={{ color: '#666', fontFamily: 'sans-serif' }}>This is a temporary white screen for testing navigation.</p>
      <button 
        onClick={() => window.location.href = '/'}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px'
        }}
      >
        Go Back to Home
      </button>
    </div>
  );
};
