'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamically import the template with loading optimization
const AiNextTemplate = dynamic(() => import('./AiNextTemplate'), {
  loading: () => (
    <div className="loading-container" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontSize: '18px',
      fontWeight: '500'
    }}>
      <div className="loading-content">
        <div className="spinner" style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255,255,255,0.3)',
          borderTop: '3px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }}></div>
        Loading AiNext...
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  ),
  ssr: false // Disable SSR for faster initial load
})

export default function ClientWrapper() {
  return (
    <Suspense fallback={
      <div className="loading-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px',
        fontWeight: '500'
      }}>
        <div className="loading-content">
          <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255,255,255,0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }}></div>
          Loading AiNext...
        </div>
      </div>
    }>
      <AiNextTemplate />
    </Suspense>
  )
}
