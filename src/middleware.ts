import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Cron endpoint uses its own Bearer token (CRON_SECRET), not Clerk session
const isCronRoute = createRouteMatcher(["/api/cron/(.*)"]);

// Define routes that should be protected (e.g. dashboard, api, generator)
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/generator(.*)",
  "/schedule(.*)",
  "/api(.*)",
  "/",
  "/analytics(.*)",
  "/brand-voice(.*)",
  "/settings(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isCronRoute(req)) return NextResponse.next(); // Let cron through; route validates CRON_SECRET
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
