// Public configuration. These values are safe for the browser: data access is
// enforced by Row Level Security, not by keeping these secret.
// NEXT_PUBLIC_* must be referenced literally so Next.js can inline them.

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env.local.`);
  }
  return value;
}

export const env = {
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseKey: required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
  // Base URL encoded in QR codes. If NEXT_PUBLIC_SITE_URL isn't set, fall back to
  // the host's own production URL (Netlify sets URL, Vercel sets
  // VERCEL_PROJECT_PRODUCTION_URL) before localhost.
  siteUrl: (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    "http://localhost:3000"
  ).replace(/\/+$/, ""),
};
