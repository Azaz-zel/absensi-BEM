/**
 * Auth cookie defaults shared by the browser client, server client, and
 * middleware. Supabase writes a long-lived cookie (400 days) so operators stay
 * signed in across browser restarts instead of logging in every visit.
 */
export const AUTH_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
