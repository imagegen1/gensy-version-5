'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface OptimizedLayoutProps {
  children: React.ReactNode
  title?: string
  currentPage?: string
}

export default function OptimizedLayout({ children, title, currentPage = '' }: OptimizedLayoutProps) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [isNavVisible, setIsNavVisible] = useState(false)

  useEffect(() => {
    // Delay navigation rendering for better initial load
    const timer = setTimeout(() => {
      setIsNavVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {/* Critical inline styles for immediate rendering */}
      <style jsx>{`
        .optimized-navbar {
          position: fixed;
          top: 0;
          width: 100%;
          z-index: 1000;
          background: rgba(5, 9, 19, 0.95);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          padding: 1rem 0;
        }
        
        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .nav-logo img {
          height: 40px;
          width: auto;
        }
        
        .nav-buttons {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        
        .nav-btn {
          padding: 8px 20px;
          border-radius: 20px;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          font-size: 14px;
        }
        
        .nav-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .nav-btn-secondary {
          background: transparent;
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .nav-btn:hover {
          transform: translateY(-1px);
        }
        
        .main-content {
          min-height: 100vh;
        }
        
        @media (max-width: 768px) {
          .nav-logo img {
            height: 35px;
          }
          
          .nav-buttons {
            gap: 0.5rem;
          }
          
          .nav-btn {
            padding: 6px 16px;
            font-size: 13px;
          }
        }
      `}</style>

      {/* Optimized Navigation */}
      {isNavVisible && (
        <nav className="optimized-navbar">
          <div className="nav-container">
            <a href="/landing-page-2" className="nav-logo">
              <img 
                src="/ainext-template/assets/img/main logo.svg" 
                alt="Gensy Logo"
                loading="eager"
                decoding="async"
              />
            </a>
            
            <div className="nav-buttons">
              {isSignedIn ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="nav-btn nav-btn-primary"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/auth/sign-in')}
                    className="nav-btn nav-btn-secondary"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push('/auth/sign-up')}
                    className="nav-btn nav-btn-primary"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      {/* Minimal Footer - Load later */}
      <footer style={{
        background: '#050913',
        color: 'white',
        padding: '2rem 0',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <img 
              src="/ainext-template/assets/img/main logo.svg" 
              alt="Gensy Logo"
              style={{ height: '45px', width: 'auto' }}
              loading="lazy"
            />
          </div>
          <p style={{ margin: '0', opacity: '0.8', fontSize: '14px' }}>
            © 2025 Gensy. All Rights Reserved.
          </p>
        </div>
      </footer>
    </>
  )
}
