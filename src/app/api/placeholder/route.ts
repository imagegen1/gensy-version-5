import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const width = parseInt(searchParams.get('w') || '150')
  const height = parseInt(searchParams.get('h') || '150')
  
  // Create a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <rect x="10%" y="10%" width="80%" height="80%" fill="#e5e7eb" rx="8"/>
      <circle cx="30%" cy="35%" r="8%" fill="#d1d5db"/>
      <rect x="20%" y="55%" width="60%" height="8%" fill="#d1d5db" rx="4"/>
      <rect x="20%" y="70%" width="40%" height="6%" fill="#e5e7eb" rx="3"/>
      <text x="50%" y="90%" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="12">${width}x${height}</text>
    </svg>
  `
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000',
    },
  })
}
