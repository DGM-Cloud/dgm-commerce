import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);
const { mockProducts } = require("../src/data/mockProducts.ts");
const rootDir = process.cwd();

loadEnvFile(".env");
loadEnvFile(".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

let updatedProducts = 0;

for (const product of mockProducts) {
  const image = product.images?.[0];
  if (!image || !image.startsWith("http")) continue;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/admin_inventory_items?product_id=eq.${product.id}`,
    {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        "content-type": "application/json",
        prefer: "return=minimal",
      },
      body: JSON.stringify({ image }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed updating product ${product.id}: ${response.status} ${await response.text()}`);
  }

  updatedProducts += 1;
}

console.log(`Updated image URLs for ${updatedProducts} products in Supabase.`);

function loadEnvFile(filename) {
  const envPath = path.join(rootDir, filename);
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
