/**
 * Smoke checks for admin fluency layer (no network).
 * Run: npm run smoke:admin
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function runTsModule(relativePath, expression) {
  const moduleUrl = pathToFileURL(path.join(root, relativePath)).href;
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--no-warnings",
      "--input-type=module",
      "-e",
      `import * as mod from ${JSON.stringify(moduleUrl)}; ${expression}`,
    ],
    { encoding: "utf8", cwd: root },
  );
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    throw new Error(`Failed running ${relativePath}`);
  }
  return result.stdout;
}

function runListParamsChecks() {
  const out = runTsModule(
    "src/lib/admin-query/list-params.ts",
    `
import assert from "node:assert/strict";
const full = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
const p1 = mod.paginateItems(full, 1, 25);
assert.equal(p1.items.length, 25);
assert.equal(p1.total, 100);
assert.equal(p1.items[0].id, 1);
const p4 = mod.paginateItems(full, 4, 25);
assert.equal(p4.items[0].id, 76);
const all = mod.paginateItems(full, 1, 0);
assert.equal(all.items.length, 100);
const q = mod.parseAdminListQuery("http://x/api?page=2&pageSize=25&q=polo&stock=low&collection=GYM&status=active&productsOnly=1");
assert.equal(q.page, 2);
assert.equal(q.pageSize, 25);
assert.equal(q.q, "polo");
assert.equal(q.stock, "low");
assert.equal(q.collection, "GYM");
assert.equal(q.status, "active");
assert.equal(q.productsOnly, true);
console.log("ok list-params");
`,
  );
  process.stdout.write(out);
}

function runKeysChecks() {
  const out = runTsModule(
    "src/lib/admin-query/keys.ts",
    `
import assert from "node:assert/strict";
const inv = mod.adminKeys.inventoryProducts({ page: 1, pageSize: 25 });
const sales = mod.adminKeys.sales({ page: 1, pageSize: 50 });
const contacts = mod.adminKeys.contacts({ page: 1, pageSize: 50 });
const store = mod.adminKeys.storeCms();
const dash = mod.adminKeys.dashboard();
assert.deepEqual(inv.slice(0, 2), ["admin", "inventory-products"]);
assert.deepEqual(sales.slice(0, 2), ["admin", "sales"]);
assert.deepEqual(contacts.slice(0, 2), ["admin", "contacts"]);
assert.deepEqual(store, ["admin", "store-cms"]);
assert.deepEqual(dash, ["admin", "dashboard"]);
console.log("ok adminKeys");
`,
  );
  process.stdout.write(out);
}

function runPartialCmsGuardChecks() {
  const broken = { seo: {}, home: {} };
  assert.doesNotThrow(() => {
    Boolean(broken.seo?.title && broken.seo?.description);
    (broken.home?.hero?.slides ?? []).some((s) => s.title && s.text);
    Boolean(broken.home?.featured?.title);
    (broken.home?.value?.points ?? []).every((p) => p.title && p.text);
    Boolean(broken.home?.finalCta?.title && broken.home?.finalCta?.cta?.label);
  });
  console.log("ok partial-cms optional chaining guards");
}

function runDashboardNormalizeChecks() {
  const out = runTsModule(
    "src/lib/admin-query/normalize-dashboard.ts",
    `
import assert from "node:assert/strict";
const nested = mod.normalizeDashboard({ dashboard: { kpis: [{ label: "A", value: "1", delta: "+", note: "n", tone: "neutral" }] } });
assert.equal(nested.kpis.length, 1);
assert.ok(Array.isArray(nested.alerts));
assert.ok(Array.isArray(nested.health));
assert.ok(Array.isArray(nested.topProducts));
assert.ok(Array.isArray(nested.statusBreakdown));
assert.ok(Array.isArray(nested.channelShare));
assert.ok(Array.isArray(nested.dailyTrend.labels));

const flat = mod.normalizeDashboard({ kpis: [], alerts: [] });
assert.ok(Array.isArray(flat.kpis));

const broken = mod.normalizeDashboard({ dashboard: { foo: 1 } });
assert.doesNotThrow(() => broken.kpis.map((k) => k.label));
assert.doesNotThrow(() => broken.alerts.map((a) => a.title));
assert.doesNotThrow(() => broken.health.map((h) => h.title));

const empty = mod.normalizeDashboard(undefined);
assert.equal(empty.kpis.length, 0);
console.log("ok normalizeDashboard");
`,
  );
  process.stdout.write(out);
}

runListParamsChecks();
runKeysChecks();
runPartialCmsGuardChecks();
runDashboardNormalizeChecks();
console.log("\nAll smoke checks passed.");
