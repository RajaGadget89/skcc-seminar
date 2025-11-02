/**
 * Centralized configuration utility for environment variables
 * Provides warnings for missing optional variables and validates required ones
 */

import { getAppUrl } from "./env";

export interface AppConfig {
  // Required environment variables
  supabase: {
    url: string;
    serviceRoleKey: string;
  };

  // Optional environment variables (with warnings if missing)
  email: {
    resendApiKey: string | null;
    fromEmail: string | null;
    replyToEmail: string | null;
  };

  telegram: {
    botToken: string | null;
    chatId: string | null;
  };

  app: {
    url: string | null;
  };
}

// Check if we're in build phase (Next.js builds don't have env vars)
const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-development-build" ||
  (typeof process.env.NODE_ENV !== "undefined" &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL);

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  // During build phase, return placeholder to allow build to complete
  // Validation will happen at runtime when actually used
  if (isBuildPhase && !value) {
    return `__PLACEHOLDER_${name}__`;
  }
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

function getOptionalEnvVar(name: string): string | null {
  const value = process.env[name];
  if (!value) {
    // Only warn at runtime, not during build
    if (!isBuildPhase) {
      console.warn(
        `Optional environment variable ${name} is not set - some features will be disabled`,
      );
    }
  }
  return value || null;
}

/**
 * Get email from address with production validation
 * In production, EMAIL_FROM is required and must be a verified sender
 * In non-production, falls back to safe test domain
 */
export function getEmailFromAddress(): string {
  const from = process.env.EMAIL_FROM;
  const env = process.env.NODE_ENV || "development";

  if (env === "production") {
    if (!from) {
      throw new Error("EMAIL_FROM is required in production");
    }
    return from; // must be a verified sender on Resend
  }

  // non-prod safe fallback (no real sending)
  return from || "noreply@local.test";
}

/**
 * Get base URL for the application
 * Centralized helper for building absolute URLs
 */
export function getBaseUrl(): string {
  return getAppUrl();
}

// Lazy-loaded config - only evaluated when accessed, not at module load time
let _config: AppConfig | null = null;

function getConfig(): AppConfig {
  if (!_config) {
    _config = {
      supabase: {
        url: getRequiredEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
        serviceRoleKey: getRequiredEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
      },

      email: {
        resendApiKey: getOptionalEnvVar("RESEND_API_KEY"),
        fromEmail: getOptionalEnvVar("EMAIL_FROM"),
        replyToEmail: getOptionalEnvVar("REPLY_TO_EMAIL"),
      },

      telegram: {
        botToken: getOptionalEnvVar("TELEGRAM_BOT_TOKEN"),
        chatId: getOptionalEnvVar("TELEGRAM_CHAT_ID"),
      },

      app: {
        url: getAppUrl(),
      },
    };

    // Validate that required vars are not placeholders (runtime validation only, skip during build)
    if (!isBuildPhase) {
      if (_config.supabase.url.startsWith("__PLACEHOLDER_")) {
        throw new Error(
          `Required environment variable NEXT_PUBLIC_SUPABASE_URL is not set`,
        );
      }
      if (_config.supabase.serviceRoleKey.startsWith("__PLACEHOLDER_")) {
        throw new Error(
          `Required environment variable SUPABASE_SERVICE_ROLE_KEY is not set`,
        );
      }
    }

    // Log configuration status on first access (runtime only)
    if (!isBuildPhase) {
      console.log("App configuration loaded:", {
        hasSupabase: !!_config.supabase.url,
        hasEmail: !!(_config.email.resendApiKey && _config.email.fromEmail),
        hasTelegram: !!(_config.telegram.botToken && _config.telegram.chatId),
        hasAppUrl: !!_config.app.url,
      });
    }
  }
  return _config;
}

// Export config as a getter to ensure lazy loading
export const config: AppConfig = new Proxy({} as AppConfig, {
  get(_target, prop) {
    return getConfig()[prop as keyof AppConfig];
  },
});

// Validation helpers
export const hasEmailConfig = (): boolean => {
  const cfg = getConfig();
  return !!(cfg.email.resendApiKey && cfg.email.fromEmail);
};

export const hasTelegramConfig = (): boolean => {
  const cfg = getConfig();
  return !!(cfg.telegram.botToken && cfg.telegram.chatId);
};
