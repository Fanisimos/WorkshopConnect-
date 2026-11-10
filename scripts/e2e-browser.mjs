// ---------------------------------------------------------------------
// End-to-end browser test of both user journeys, using the installed
// Google Chrome (playwright-core, headless). Real forms, real Server
// Actions, real Supabase.
//
//   npm run test:e2e -- [baseUrl] [--screenshots=<dir>]
//
// Accounts come from .env.test.local (see scripts/smoke-live.mjs). The
// organiser account must have been promoted once. Each run creates one
// workshop titled "[E2E test] …" and marks it completed at the end.
// ---------------------------------------------------------------------
import { chromium } from "playwright-core";

const args = process.argv.slice(2);
const BASE = (args.find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/$/, "");
const SHOTS = args.find((a) => a.startsWith("--screenshots="))?.split("=")[1];
const { SMOKE_EMAIL, SMOKE_PASSWORD, ORG_EMAIL, ORG_PASSWORD } = process.env;

let failures = 0;
let step = 0;
const ok = (cond, msg) => {
  step++;
  console.log(`${cond ? "ok" : "NOT OK"} ${step} - ${msg}`);
  if (!cond) failures++;
};

/** UK local date/time strings for an instant (what an organiser would type). */
function ukParts(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(date).map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });

async function loginAs(email, password, expectPath) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } }); // phone-sized
  const page = await context.newPage();
  page.on("dialog", (d) => d.accept()); // confirm() prompts
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL((u) => u.pathname.startsWith(expectPath), { timeout: 20_000 });
  return page;
}

try {
  // ------------------------------------------------------------ organiser
  const org = await loginAs(ORG_EMAIL, ORG_PASSWORD, "/");
  if (!new URL(org.url()).pathname.startsWith("/organiser")) {
    console.log(`Organiser test account is not an organiser yet. Run in the Supabase SQL editor:\n  select public.promote_to_organiser('${ORG_EMAIL}');`);
    process.exit(2);
  }
  ok(true, "organiser logs in through the login form and lands on /organiser");

  // validation: empty form
  await org.goto(`${BASE}/organiser/workshops/new`);
  await org.getByRole("button", { name: "Publish workshop" }).click();
  await org.getByText("Title must be at least 3 characters.").waitFor();
  ok(true, "empty workshop form shows validation errors");

  // create a published workshop happening now
  const start = new Date(Date.now() - 5 * 60_000);
  const end = new Date(start.getTime() + 60 * 60_000);
  const s = ukParts(start);
  const e = ukParts(end);
  const title = `[E2E test] SQL JOINs ${s.date} ${s.time}`;
  await org.getByLabel("Title", { exact: true }).fill(title);
  await org.getByLabel(/Description/).fill("Automated end-to-end test workshop.");
  await org.getByLabel("Date").fill(s.date);
  await org.getByLabel("Start time").fill(s.time);
  await org.getByLabel("End time").fill(e.date === s.date ? e.time : "23:59");
  await org.getByLabel("Location").fill("Room E2E");
  await org.getByLabel(/Focus topics/).fill("SQL JOINs, GROUP BY");
  await org.getByRole("button", { name: "Publish workshop" }).click();
  await org.waitForURL(/\/organiser\/workshops\/[0-9a-f-]{36}\?created=1/);
  const workshopId = org.url().match(/workshops\/([0-9a-f-]{36})/)[1];
  ok(await org.getByText("Workshop published.").isVisible(), "organiser creates and publishes a workshop through the form");

  await org.getByRole("link", { name: "Show check-in QR" }).click();
  await org.waitForURL(/\/qr$/);
  const qrUrl = await org.locator("p.font-mono").innerText();
  const token = qrUrl.match(/check-in\/([0-9a-f-]{36})/)?.[1];
  ok(Boolean(token) && (await org.locator("svg").count()) > 0, `QR page shows a QR code (${qrUrl})`);
  await shot(org, "organiser-qr");

  // ------------------------------------------------------------ student
  const stu = await loginAs(SMOKE_EMAIL, SMOKE_PASSWORD, "/dashboard");
  ok(true, "student logs in through the login form and lands on /dashboard");

  await stu.goto(`${BASE}/organiser/workshops/${workshopId}/insights`);
  ok(new URL(stu.url()).pathname === "/dashboard", "student opening an organiser page is sent to their dashboard");

  await stu.goto(`${BASE}/check-in/${token}`);
  ok(await stu.getByRole("heading", { name: "You're checked in" }).isVisible(), "student scans the QR link and is checked in");
  await shot(stu, "student-check-in");
  await stu.goto(`${BASE}/check-in/${token}`);
  ok(await stu.getByRole("heading", { name: "Already checked in" }).isVisible(), "scanning again says 'Already checked in'");

  await stu.goto(`${BASE}/workshops/${workshopId}`);
  await stu.getByRole("link", { name: "Give feedback" }).click();
  await stu.waitForURL(/\/feedback$/);

  await stu.getByRole("button", { name: "Submit feedback" }).click();
  await stu.getByText("Choose a rating from 1 to 5.").waitFor();
  ok(true, "feedback without a rating shows a validation error");

  await stu.locator('input[name="rating"][value="4"]').check({ force: true });
  await stu.getByLabel(/Comments/).fill("Clear examples. More practice on JOINs please.");
  await stu.getByRole("button", { name: "Submit feedback" }).click();
  await stu.getByText("Thanks for your feedback!").waitFor();
  ok(true, "student submits a 4/5 rating with a comment");

  await stu.locator('input[name="confidenceBefore"][value="2"]').check({ force: true });
  await stu.locator('input[name="confidenceAfter"][value="4"]').check({ force: true });
  await stu.locator('input[name="topic"][value="SQL JOINs"]').check({ force: true });
  await stu.getByRole("button", { name: "Save Learning Pulse" }).click();
  await stu.getByText("Learning Pulse saved. Thank you!").waitFor();
  await stu.reload();
  ok(await stu.getByText("+2.0").isVisible(), "Learning Pulse saved: before 2, now 4, change +2.0");
  await shot(stu, "student-feedback-done");

  // two requests: one to fulfil via the insights loop, one via the request card
  for (const [topic, text] of [
    ["SQL JOINs", "Could you share practice exercises on LEFT and INNER JOINs?"],
    ["GROUP BY", "A worked example of GROUP BY with HAVING would help."],
  ]) {
    await stu.goto(`${BASE}/workshops/${workshopId}/request`);
    await stu.locator(`input[name="topic"][value="${topic}"]`).check({ force: true });
    await stu.getByLabel("What would help you?").fill(text);
    await stu.getByRole("button", { name: "Send request" }).click();
    await stu.waitForURL(/\/requests\?sent=1/);
  }
  ok((await stu.getByText("Pending").count()) >= 2, "student sends two resource requests; both show as Pending");

  // ------------------------------------------------------------ organiser: insights → follow-up
  await org.goto(`${BASE}/organiser/workshops/${workshopId}/insights`);
  const needsRow = org.getByRole("row", { name: /SQL JOINs/ });
  ok(await needsRow.isVisible(), "insights list SQL JOINs as a learning need");
  ok(await org.getByText("4.0").first().isVisible(), "insights show the 4.0 average rating");
  ok(await org.getByText("+2.0").first().isVisible(), "insights show +2.0 average confidence change");
  ok(await org.getByText("Clear examples. More practice on JOINs please.").isVisible(), "comment shown (without student name)");
  await shot(org, "organiser-insights");

  await needsRow.getByRole("link", { name: "Share resource" }).click();
  await org.waitForURL(/follow-up\?topic=SQL/);
  const share = org.locator("#share");
  ok((await share.getByLabel(/^Topic/).inputValue()) === "SQL JOINs", "Share resource pre-fills the topic");
  ok(await share.getByRole("checkbox").isChecked(), "'also fulfil the 1 open request' is offered and ticked");
  await share.getByLabel("Title", { exact: true }).fill("SQL JOINs practice set");
  await share.getByLabel("Link", { exact: true }).fill("https://www.w3schools.com/sql/sql_join.asp");
  await share.getByRole("button", { name: "Share resource" }).click();
  await org.getByText(/1 matching request was marked as fulfilled/).waitFor();
  ok(true, "sharing a resource for the topic fulfils the matching open request");

  await org.reload();
  const groupBy = org.locator("li", { hasText: "A worked example of GROUP BY" }).first();
  await groupBy.getByText("Respond to this request").click();
  await groupBy.getByRole("button", { name: "Mark as in progress" }).click();
  await org.waitForLoadState("networkidle");
  await org.reload();
  const groupBy2 = org.locator("li", { hasText: "A worked example of GROUP BY" }).first();
  ok(await groupBy2.getByText("In progress").isVisible(), "organiser marks the GROUP BY request in progress");
  await groupBy2.getByText("Respond to this request").click();
  await groupBy2.getByRole("button", { name: "Mark as fulfilled" }).click();
  await groupBy2.getByText("Share a resource or write a short note").waitFor();
  ok(true, "fulfilling with nothing filled in is rejected");
  await groupBy2.getByLabel(/Note to the student/).fill("We'll cover GROUP BY with HAVING at the start of next week's session.");
  await groupBy2.getByRole("button", { name: "Mark as fulfilled" }).click();
  await org.getByText("Request fulfilled.").waitFor();
  ok(true, "organiser fulfils the GROUP BY request with a note");
  await shot(org, "organiser-follow-up");

  // ------------------------------------------------------------ student sees the loop closed
  await stu.goto(`${BASE}/requests`);
  ok(await stu.getByRole("link", { name: /SQL JOINs practice set/ }).first().isVisible(), "student sees the shared resource on the fulfilled request");
  ok(await stu.getByText("We'll cover GROUP BY with HAVING").isVisible(), "student sees the organiser's note");
  await shot(stu, "student-requests");
  await stu.goto(`${BASE}/dashboard`);
  ok(
    await stu.getByRole("region", { name: "Resources for topics you asked about" }).getByText("SQL JOINs practice set").first().isVisible(),
    "dashboard lists the resource under 'Resources for topics you asked about'",
  );
  await shot(stu, "student-dashboard");

  // ------------------------------------------------------------ organiser: dashboard, drafts, completion
  await org.goto(`${BASE}/organiser`);
  ok(await org.getByText("Outstanding requests").isVisible(), "organiser dashboard renders insights");
  await shot(org, "organiser-dashboard");

  await org.goto(`${BASE}/organiser/workshops/new`);
  await org.getByLabel("Title", { exact: true }).fill("[E2E test] Draft to delete");
  await org.getByLabel("Date").fill(s.date);
  await org.getByLabel("Start time").fill("09:00");
  await org.getByLabel("End time").fill("10:00");
  await org.getByLabel("Location").fill("Nowhere");
  await org.getByRole("button", { name: "Save as draft" }).click();
  await org.waitForURL(/created=1/);
  await org.getByRole("button", { name: "Delete draft" }).click();
  await org.waitForURL((u) => u.pathname === "/organiser/workshops");
  ok(!(await org.getByText("[E2E test] Draft to delete").isVisible()), "organiser saves a draft and deletes it");

  await org.goto(`${BASE}/organiser/workshops/${workshopId}`);
  await org.getByRole("button", { name: "Mark as completed" }).click();
  await org.getByText("This workshop has finished.").waitFor();
  ok(true, "organiser marks the workshop completed");
} catch (error) {
  failures++;
  console.log(`NOT OK - unexpected error: ${error.message.split("\n")[0]}`);
} finally {
  await browser.close();
}

console.log(failures ? `\n${failures} check(s) FAILED` : `\nALL ${step} END-TO-END CHECKS PASSED`);
process.exit(failures ? 1 : 0);
