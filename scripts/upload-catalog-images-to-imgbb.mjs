import { createRequire } from "node:module";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);
const { mockProducts } = require("../src/data/mockProducts.ts");

const rootDir = process.cwd();
const mapPath = path.join(rootDir, "src", "data", "imgbb-image-map.json");
const productFilePath = path.join(rootDir, "src", "data", "mockProducts.ts");
const migrationPath = path.join(rootDir, "supabase", "migrations", "003_inventory_image_urls.sql");
const args = new Set(process.argv.slice(2));
const rewriteProducts = args.has("--rewrite-products");
const writeSql = args.has("--write-sql");
const force = args.has("--force");

loadEnvFile(".env");
loadEnvFile(".env.local");

const apiKey = process.env.IMGBB_API_KEY || process.env.IMG_BB_API_KEY;

if (!apiKey) {
  throw new Error("Missing IMGBB_API_KEY. Add it to .env.local before running this script.");
}

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

function readImageMap() {
  if (!existsSync(mapPath)) return {};
  return JSON.parse(readFileSync(mapPath, "utf8"));
}

function uniqueLocalImages() {
  const images = new Set();

  for (const product of mockProducts) {
    for (const image of product.images || []) {
      if (typeof image === "string" && image.startsWith("/")) {
        images.add(image);
      }
    }
  }

  return Array.from(images).sort();
}

async function uploadImage(localUrl) {
  const absolutePath = path.join(rootDir, "public", localUrl.replace(/^\//, ""));
  const fileBuffer = await readFile(absolutePath);
  const filename = path.basename(absolutePath);
  const form = new FormData();
  const blob = new Blob([fileBuffer]);

  form.append("image", blob, filename);
  form.append("name", filename.replace(/\.[^.]+$/, ""));

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    body: form,
  });
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload?.error?.message || `ImgBB upload failed for ${localUrl}`);
  }

  return payload.data.display_url || payload.data.url;
}

function primaryImageUpdates(imageMap) {
  return mockProducts
    .map((product) => {
      const localImage = product.images?.[0];
      const remoteImage = localImage ? imageMap[localImage] : null;
      if (!remoteImage) return null;

      return {
        productId: product.id,
        image: remoteImage,
      };
    })
    .filter(Boolean);
}

async function writeInventoryImageSql(imageMap) {
  const updates = primaryImageUpdates(imageMap);
  const values = updates
    .map((update) => `    (${update.productId}, '${sqlEscape(update.image)}')`)
    .join(",\n");

  const sql = `with image_updates (product_id, image) as (\n  values\n${values}\n)\nupdate public.admin_inventory_items inventory\nset image = image_updates.image,\n    updated_at = now()\nfrom image_updates\nwhere inventory.product_id = image_updates.product_id;\n\nnotify pgrst, 'reload schema';\n`;

  await writeFile(migrationPath, sql, "utf8");
}

function rewriteProductImages(imageMap) {
  let source = readFileSync(productFilePath, "utf8");

  for (const [localImage, remoteImage] of Object.entries(imageMap)) {
    source = source.split(localImage).join(remoteImage);
  }

  writeFileSync(productFilePath, source, "utf8");
}

function sqlEscape(value) {
  return String(value).replaceAll("'", "''");
}

const imageMap = readImageMap();
const images = uniqueLocalImages();

console.log(`Found ${images.length} local catalog images.`);

for (const localImage of images) {
  if (imageMap[localImage] && !force) {
    console.log(`skip  ${localImage}`);
    continue;
  }

  console.log(`upload ${localImage}`);
  imageMap[localImage] = await uploadImage(localImage);
  await mkdir(path.dirname(mapPath), { recursive: true });
  await writeFile(mapPath, `${JSON.stringify(imageMap, null, 2)}\n`, "utf8");
}

if (writeSql) {
  await writeInventoryImageSql(imageMap);
  console.log(`Wrote ${path.relative(rootDir, migrationPath)}`);
}

if (rewriteProducts) {
  rewriteProductImages(imageMap);
  console.log("Rewrote src/data/mockProducts.ts with ImgBB URLs.");
}

console.log(`Done. Image map: ${path.relative(rootDir, mapPath)}`);
