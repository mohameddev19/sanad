import { defaultLocale, locales } from "@/i18n/config";
import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from "@/i18n/routing";

// Define public routes (accessible without login)
// Kinde middleware protects everything else by default.
// Add locale prefixes if using 'always' localePrefix for next-intl.
const publicRoutes = [
    // Matches '/' or '/en' or '/ar' etc.
    // Adjust regex if your locales change or localePrefix is 'always'
    new RegExp(`^\/((${locales.join('|')})\\/?$)?$`),
];

const intlMiddleware = createIntlMiddleware(routing);

// Wrap the main logic with Kinde's withAuth
export default withAuth(async function middleware(request: NextRequest) {
    // 1. Run i18n middleware
    const i18nResponse = intlMiddleware(request);

    // Check if i18n middleware handled the request (e.g., redirect/rewrite)
    if (i18nResponse.headers.get('x-middleware-rewrite') || i18nResponse.status === 307 || i18nResponse.status === 308) {
        // If i18n handled it, return its response
        return i18nResponse;
    }

    // 2. If i18n didn't handle it, let Kinde continue
    // Kinde's withAuth wrapper will handle authentication based on publicRoutes.
    // If the route is protected and user isn't logged in, withAuth redirects.
    // If route is public or user is logged in, it allows the request (or returns NextResponse.next()).
    // We might need to return NextResponse.next() explicitly if i18n didn't modify but didn't redirect.
    // However, often simply returning nothing or undefined implicitly allows Kinde to proceed.
    // Let's return the i18n response if it wasn't a redirect/rewrite but might have added headers.
    return i18nResponse; 

    // Note: Fine-grained *authorization* (e.g., role/permission checks like admin access)
    // should still be handled within specific page/layout components using
    // getKindeServerSession() from "@kinde-oss/kinde-auth-nextjs/server".
}, {
    // Kinde configuration passed as the second argument to withAuth
    publicRoutes: publicRoutes,
});

export const config = {
  // Match all routes except static files, images, and Kinde's API routes
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (Kinde auth routes)
     */
    '/((?!api/auth|api|_next/static|_next/image|favicon.ico).*)',
  ]
}; 