// ---------------------------------------------------------------------
// Live smoke test against the real Supabase project + running app.
//   node --env-file=.env.local scripts/smoke-live.mjs [baseUrl]
// Uses only the publishable key (no secrets). Creates/reuses one test
// student account and checks live RLS + role routing as that student.
// Password comes from SMOKE_PASSWORD or is generated and printed once.
// ---------------------------------------------------------------------
import { randomBytes } from "node:crypto";

import { createServerClient } from "@supabase/ssr";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const EMAIL = process.env.SMOKE_EMAIL ?? "wc-smoke-student@example.com";
const PASSWORD = process.env.SMOKE_PASSWORD ?? randomBytes(12).toString("base64url");

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "ok" : "NOT OK"} - ${msg}`);
  if (!cond) failures++;
};

// In-memory cookie jar, same cookie format the Next.js app reads.
const jar = new Map();
const supabase = createServerClient(URL_, KEY, {
  cookies: {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: (list) => list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
  },
});

// 1. sign in, or register if the account doesn't exist yet
let { data: signIn, error } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
if (error) {
  const res = await supabase.auth.signUp({
    email: EMAIL,
    password: PASSWORD,
    options: { data: { full_name: "Smoke Test Student", role: "organiser" } }, // role must be ignored
  });
  if (res.error) {
    console.error(`Could not sign in or register ${EMAIL}: ${res.error.code ?? res.error.message}`);
    process.exit(1);
  }
  if (!res.data.session) {
    console.error(`Registered ${EMAIL}, but Supabase returned no session: "Confirm email" is still ON.`);
    console.error("Turn it off (Authentication → Sign In / Providers → Email) and confirm this user, then rerun.");
    process.exit(1);
  }
  console.log(`Registered ${EMAIL} — set SMOKE_PASSWORD to reuse it.`);
  signIn = res.data;
}
const userId = signIn.user.id;

// 2. live database rules as this student
const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", userId).single();
ok(profile?.role === "student", "live: new account is a student even though sign-up metadata said organiser");

const roleUpdate = await supabase.from("profiles").update({ role: "organiser" }).eq("id", userId);
ok(roleUpdate.error?.code === "42501", "live: student cannot change own role");

const tokens = await supabase.from("workshop_qr_tokens").select("token");
ok(!tokens.error && tokens.data.length === 0, "live: student reads zero QR tokens");

const insert = await supabase
  .from("workshops")
  .insert({ title: "Smoke", location: "Nowhere", starts_at: new Date().toISOString(), ends_at: new Date(Date.now() + 3600e3).toISOString() });
ok(insert.error?.code === "42501", "live: student cannot create a workshop");

const others = await supabase.from("profiles").select("id").eq("role", "student").neq("id", userId);
ok(!others.error && others.data.length === 0, "live: student cannot list other students");

const promote = await supabase.rpc("promote_to_organiser", { p_email: EMAIL });
ok(promote.error?.code === "42501", "live: student cannot call promote_to_organiser");

// 3. the running app, with this session's cookies
const cookie = [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
async function get(path) {
  const res = await fetch(BASE + path, { headers: { cookie }, redirect: "manual" });
  return { status: res.status, location: res.headers.get("location"), body: res.status === 200 ? await res.text() : "" };
}

const dash = await get("/dashboard");
ok(dash.status === 200 && dash.body.includes("Hi, Smoke"), "app: student dashboard renders for the logged-in student");

const list = await get("/workshops");
ok(list.status === 200 && list.body.includes("Workshops"), "app: workshop list renders");

const org = await get("/organiser");
ok(org.status === 307 && org.location?.endsWith("/dashboard"), "app: student is redirected away from /organiser");

const orgNew = await get("/organiser/workshops/new");
ok(orgNew.status === 307 && orgNew.location?.endsWith("/dashboard"), "app: student is redirected away from /organiser/workshops/new");

const login = await get("/login");
ok(login.status === 307 && login.location?.endsWith("/dashboard"), "app: logged-in student visiting /login goes to dashboard");

const bogus = await get("/workshops/not-a-uuid");
ok(bogus.status === 404, "app: invalid workshop id returns 404");

await supabase.auth.signOut();
console.log(failures ? `\n${failures} check(s) FAILED` : "\nALL LIVE SMOKE CHECKS PASSED");
process.exit(failures ? 1 : 0);
