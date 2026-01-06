import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip authentication for all API routes
  if (pathname.startsWith('/api/')) {
    console.log('Allowing unauthenticated access to:', pathname)
    return NextResponse.next()
  }
  
  // For all other routes, continue with normal flow
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
