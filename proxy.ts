import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - /api/health (public diagnostic endpoint)
     * - manifest.json, sw.js (must be publicly fetchable for PWA install/service worker)
     * - image/font files
     */
    "/((?!_next/static|_next/image|favicon.ico|api/health|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
