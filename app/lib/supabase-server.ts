import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { assertDbRouting, logDbRouting } from "./env-guards";

// Validate database routing on module load (development only, skip during build)
// During build phase, env vars may not be available, so skip validation
const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-development-build" ||
  (typeof process.env.NODE_ENV !== "undefined" &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.SUPABASE_URL);

if (process.env.NODE_ENV === "development" && !isBuildPhase) {
  try {
    assertDbRouting();
    logDbRouting();
  } catch (error) {
    console.error(
      "Database routing validation failed:",
      error instanceof Error ? error.message : String(error),
    );
    // Only exit in development, not during build
    if (!isBuildPhase) {
      process.exit(1);
    }
  }
}

/**
 * Get Supabase server client with cookie-based session management
 * This function creates a Supabase client that can read/write cookies
 * for server-visible session management
 */
export function getServerSupabase(req: NextRequest, res: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createServerClient<any>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        res.cookies.set(name, value, options);
      },
      remove(name: string, options: any) {
        res.cookies.set(name, "", { ...options, maxAge: 0 });
      },
    },
  });

  return { supabase, response: res };
}

/**
 * Get Supabase server client for middleware
 * This function creates a Supabase client that can read cookies
 * but doesn't have access to response object for setting cookies
 */
export function getMiddlewareSupabase(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createServerClient<any>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set() {
        // No-op for middleware - we can't set cookies here
      },
      remove() {
        // No-op for middleware - we can't remove cookies here
      },
    },
  });

  return supabase;
}

/**
 * Get Supabase service client for server-side operations
 * This function creates a Supabase client with service role key
 * for operations that require elevated privileges
 */
export function getSupabaseServiceClient() {
  // During build phase, env vars may not be available - return a mock client
  // that will fail gracefully at runtime if actually used
  if (isBuildPhase) {
    // Return a proxy that throws a helpful error if methods are called during build
    return new Proxy({} as any, {
      get() {
        throw new Error(
          "Supabase client cannot be used during build phase. Environment variables are not available.",
        );
      },
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient<any>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get Supabase service role client for server-only operations
 * This function creates a Supabase client with service role key
 * for server-side authorization checks
 */
export function getServiceRoleClient() {
  // During build phase, env vars may not be available - return a mock client
  // that will fail gracefully at runtime if actually used
  if (isBuildPhase) {
    // Return a proxy that throws a helpful error if methods are called during build
    return new Proxy({} as any, {
      get() {
        throw new Error(
          "Supabase client cannot be used during build phase. Environment variables are not available.",
        );
      },
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient<any>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  });
}
