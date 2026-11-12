export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** True when the browser-safe credentials exist. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** True when the server can talk to the database with full access. */
export const hasServiceRole = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);

/**
 * Preview the admin panel with sample data, without Supabase.
 * Off by default: /admin must never be reachable without a real login.
 */
export const DEMO_MODE = process.env.DEMO_MODE === "1";

export const SITE_NAME = "Absen Piket";
export const ORG_NAME = "BEM PM INSTIKI";
export const CABINET_NAME = "Kabinet Navakara";

/** Retention window for proof photos, in months. */
export const PHOTO_RETENTION_MONTHS = 12;

/** Max upload size accepted by the API, after client-side compression. */
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export const PHOTO_BUCKET = "bukti-piket";
