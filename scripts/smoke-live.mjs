// ---------------------------------------------------------------------
// Live smoke test against the real Supabase project + a running app.
//   npm run test:live -- [baseUrl]        (default http://localhost:3000)
// Uses only the publishable key (no secrets). Test accounts and their
// passwords live in .env.test.local (gitignored):
//   SMOKE_EMAIL / SMOKE_PASSWORD  test student (registered automatically)
//   ORG_EMAIL / ORG_PASSWORD      test organiser (must be promoted once with
//                                 promote_to_organiser in the SQL editor)
// The organiser part reuses ONE workshop titled "[Smoke test] …", moving
// its times to "now" on each run so check-in is open.
// ---------------------------------------------------------------------
import { createServerClient } from "@supabase/ssr";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const { NEXT_PUBLIC_SUPABASE_URL: URL_, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: KEY } = process.env;
const SMOKE_TITLE = "[Smoke test] Automated check-in test";

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "ok" : "NOT OK"} - ${msg}`);
  if (!cond) failures++;
};

/** A logged-in session using the same cookie format as the Next.js app. */
async function session(email, password, fullName, { register = false } = {}) {
  const jar = new Map();
  const supabase = createServerClient(URL_, KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  let { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error && register) {
    const res = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: "organiser" } }, // role must be ignored
    });
    if (res.error) throw new Error(`Could not register ${email}: ${res.error.code ?? res.error.message}`);
    if (!res.data.session) throw new Error(`"Confirm email" is still ON in Supabase; turn it off and rerun.`);
    console.log(`(registered ${email})`);
    data = res.data;
  } else if (error) {
    throw new Error(`Could not sign in ${email}: ${error.code ?? error.message}`);
  }
  const cookie = () => [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
  const get = async (path) => {
    const res = await fetch(BASE + path, { headers: { cookie: cookie() }, redirect: "manual" });
    const type = res.headers.get("content-type") ?? "";
    return {
      status: res.status,
      location: res.headers.get("location"),
      type,
      body: res.status === 200 && type.includes("text/html") ? await res.text() : "",
    };
  };
  return { supabase, userId: data.user.id, get };
}

// =====================================================================
// Student
// =====================================================================
const student = await session(process.env.SMOKE_EMAIL, process.env.SMOKE_PASSWORD, "Smoke Test Student", { register: true });
{
  const { supabase, userId, get } = student;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  ok(profile?.role === "student", "live: new account is a student even though sign-up metadata said organiser");
  ok((await supabase.from("profiles").update({ role: "organiser" }).eq("id", userId)).error?.code === "42501", "live: student cannot change own role");
  const tokens = await supabase.from("workshop_qr_tokens").select("token");
  ok(!tokens.error && tokens.data.length === 0, "live: student reads zero QR tokens");
  const insert = await supabase.from("workshops").insert({
    title: "Smoke", location: "Nowhere", starts_at: new Date().toISOString(), ends_at: new Date(Date.now() + 3600e3).toISOString(),
  });
  ok(insert.error?.code === "42501", "live: student cannot create a workshop");
  const others = await supabase.from("profiles").select("id").eq("role", "student").neq("id", userId);
  ok(!others.error && others.data.length === 0, "live: student cannot list other students");
  ok((await supabase.rpc("promote_to_organiser", { p_email: process.env.SMOKE_EMAIL })).error?.code === "42501", "live: student cannot call promote_to_organiser");
  ok((await supabase.from("attendance").insert({ workshop_id: crypto.randomUUID() })).error?.code === "42501", "live: student cannot insert attendance directly");

  const dash = await get("/dashboard");
  ok(dash.status === 200 && dash.body.includes("Hi, Smoke"), "app: student dashboard renders");
  ok((await get("/workshops")).status === 200, "app: workshop list renders");
  for (const path of ["/organiser", "/organiser/workshops/new"]) {
    const r = await get(path);
    ok(r.status === 307 && r.location?.endsWith("/dashboard"), `app: student is redirected away from ${path}`);
  }
  const login = await get("/login");
  ok(login.status === 307 && login.location?.endsWith("/dashboard"), "app: logged-in student visiting /login goes to dashboard");
  ok((await get("/workshops/not-a-uuid")).status === 404, "app: invalid workshop id returns 404");
  const badCode = await get(`/check-in/${crypto.randomUUID()}`);
  ok(badCode.status === 200 && badCode.body.includes("isn&#x27;t valid"), "app: unknown check-in code shows 'not valid'");
}

// =====================================================================
// Organiser + QR check-in (needs a promoted organiser test account)
// =====================================================================
if (!process.env.ORG_EMAIL) {
  console.log("\n(skipping organiser checks: ORG_EMAIL not set)");
} else {
  const org = await session(process.env.ORG_EMAIL, process.env.ORG_PASSWORD, "Olivia Organiser", { register: true });
  const { data: orgProfile } = await org.supabase.from("profiles").select("role").eq("id", org.userId).single();
  if (orgProfile?.role !== "organiser") {
    console.log(`\n(skipping organiser checks: run  select public.promote_to_organiser('${process.env.ORG_EMAIL}');  in the SQL editor)`);
  } else {
    const now = Date.now();
    const times = { starts_at: new Date(now - 10 * 60e3).toISOString(), ends_at: new Date(now + 50 * 60e3).toISOString() };

    // reuse one smoke workshop; move it to "now" so check-in is open
    let { data: ws } = await org.supabase.from("workshops").select("id").eq("title", SMOKE_TITLE).maybeSingle();
    if (ws) {
      await org.supabase.from("workshops").update({ ...times, status: "published" }).eq("id", ws.id);
    } else {
      const created = await org.supabase
        .from("workshops")
        .insert({ title: SMOKE_TITLE, location: "Automated test", description: "Created by scripts/smoke-live.mjs", ...times, status: "published", focus_topics: ["SQL JOINs"] })
        .select("id")
        .single();
      ok(!created.error, "live: organiser can create a workshop");
      ws = created.data;
    }
    const { data: tokenRow } = await org.supabase.from("workshop_qr_tokens").select("token").eq("workshop_id", ws.id).single();
    ok(Boolean(tokenRow?.token), "live: organiser can read their workshop's QR token");

    const detail = await org.get(`/organiser/workshops/${ws.id}`);
    ok(detail.status === 200 && detail.body.includes("Show check-in QR"), "app: organiser workshop page renders");
    const qrPage = await org.get(`/organiser/workshops/${ws.id}/qr`);
    ok(qrPage.status === 200 && qrPage.body.includes("<svg") && qrPage.body.includes(`/check-in/${tokenRow.token}`), "app: QR page shows a QR code for the check-in URL");
    const png = await org.get(`/organiser/workshops/${ws.id}/qr/download`);
    ok(png.status === 200 && png.type === "image/png", "app: organiser can download the QR PNG");

    // student scans
    const first = await student.get(`/check-in/${tokenRow.token}`);
    ok(first.status === 200 && (first.body.includes("You&#x27;re checked in") || first.body.includes("Already checked in")), "app: scanning the QR checks the student in");
    const second = await student.get(`/check-in/${tokenRow.token}`);
    ok(second.status === 200 && second.body.includes("Already checked in"), "app: scanning again says 'Already checked in'");
    const { data: rows } = await org.supabase.from("attendance").select("student_id").eq("workshop_id", ws.id).eq("student_id", student.userId);
    ok(rows?.length === 1, "live: exactly one attendance row for the student (duplicates prevented)");

    const afterScan = await org.get(`/organiser/workshops/${ws.id}`);
    ok(afterScan.body.includes("Smoke Test Student"), "app: organiser sees the student in the attendance list");
    const studentDash = await student.get("/dashboard");
    ok(studentDash.body.includes(SMOKE_TITLE), "app: student dashboard lists the attended workshop");

    const stolen = await student.get(`/organiser/workshops/${ws.id}/qr/download`);
    ok(stolen.status !== 200 || stolen.type !== "image/png", "app: student cannot download an organiser QR code");
    const orgScan = await org.get(`/check-in/${tokenRow.token}`);
    ok(orgScan.body.includes("Organiser account"), "app: organiser scanning sees 'only students can check in'");

    // leave it completed so it doesn't show as upcoming for real students
    await org.supabase.from("workshops").update({ status: "completed" }).eq("id", ws.id);
  }
}

console.log(failures ? `\n${failures} check(s) FAILED` : "\nALL LIVE SMOKE CHECKS PASSED");
process.exit(failures ? 1 : 0);
