# Database Model for DGM Commerce (Ecommerce + Admin)

This document maps a scalable Supabase/Postgres database for the future ecommerce platform.
It is designed to support:

- Admin dashboard and sales analytics
- Point of sale (POS)
- Sales management
- Inventory control
- Contacts and support
- Online store
- Configuration and multi-channel operations

## Design Principles

- Use a single source of truth in Postgres.
- Keep the commerce core channel-agnostic where possible.
- Use `channel` fields to distinguish `online`, `pos`, `admin`, `manual`, etc.
- Use UUID primary keys for all business tables.
- Track audit fields on every mutable table: `created_at`, `updated_at`, `deleted_at` when soft delete is needed.
- Prefer views/materialized views for dashboard KPIs instead of duplicating summary tables.
- Use RLS from day one in Supabase.

## High-Level Modules

1. Identity and access
2. Catalog and merchandising
3. Inventory and purchasing
4. Customers and CRM
5. Orders, payments, shipping, and refunds
6. POS and cash management
7. Contacts and support
8. Store configuration
9. Reporting and analytics

## Entity Map

### Identity and Access

#### `profiles`
Stores the public application profile for authenticated users.

Fields:
- `id` UUID, PK, references `auth.users.id`
- `full_name` text
- `email` text, unique
- `phone` text
- `avatar_url` text
- `is_active` boolean
- `last_login_at` timestamptz
- `created_at` timestamptz
- `updated_at` timestamptz

Notes:
- This is the bridge between Supabase Auth and app data.
- Admin users, staff users, and customers can all have a profile.

#### `roles`
Stores application roles.

Examples:
- `super_admin`
- `admin`
- `manager`
- `cashier`
- `warehouse`
- `support`
- `customer`

Fields:
- `id` UUID, PK
- `name` text, unique
- `description` text
- `created_at` timestamptz

#### `user_roles`
Many-to-many assignment of roles to users.

Fields:
- `id` UUID, PK
- `user_id` UUID, FK to `profiles.id`
- `role_id` UUID, FK to `roles.id`
- `created_at` timestamptz

### Catalog and Merchandising

#### `categories`
Category tree for the store.

Fields:
- `id` UUID, PK
- `parent_id` UUID, FK to `categories.id`, nullable
- `name` text
- `slug` text, unique
- `description` text
- `sort_order` integer
- `is_active` boolean
- `created_at` timestamptz
- `updated_at` timestamptz

Examples:
- Polos
- Hoodies
- Pantalones
- Accesorios
- Colecciones especiales

#### `collections`
Commercial collections or campaigns.

Fields:
- `id` UUID, PK
- `name` text
- `slug` text, unique
- `description` text
- `hero_image_url` text
- `is_featured` boolean
- `launch_date` date
- `is_active` boolean
- `created_at` timestamptz
- `updated_at` timestamptz

#### `brands`
Optional brand or line ownership for products.

Fields:
- `id` UUID, PK
- `name` text
- `slug` text, unique
- `description` text
- `created_at` timestamptz

#### `products`
Product master record.

Fields:
- `id` UUID, PK
- `category_id` UUID, FK to `categories.id`
- `collection_id` UUID, FK to `collections.id`, nullable
- `brand_id` UUID, FK to `brands.id`, nullable
- `name` text
- `slug` text, unique
- `sku_base` text, unique or indexed
- `description` text
- `detailed_description` text
- `status` text, e.g. `draft`, `active`, `archived`
- `is_featured` boolean
- `is_new` boolean
- `is_bundle` boolean
- `tax_class` text
- `created_by` UUID, FK to `profiles.id`
- `created_at` timestamptz
- `updated_at` timestamptz
- `deleted_at` timestamptz, nullable

#### `product_variants`
Sellable unit. One product can have many variants by color, size, material, etc.

Fields:
- `id` UUID, PK
- `product_id` UUID, FK to `products.id`
- `sku` text, unique
- `barcode` text, nullable, indexed
- `color` text, nullable
- `size` text, nullable
- `material` text, nullable
- `price` numeric(12,2)
- `compare_at_price` numeric(12,2), nullable
- `cost_price` numeric(12,2), nullable
- `weight_grams` integer, nullable
- `is_active` boolean
- `created_at` timestamptz
- `updated_at` timestamptz

#### `product_images`
Product media.

Fields:
- `id` UUID, PK
- `product_id` UUID, FK to `products.id`
- `variant_id` UUID, FK to `product_variants.id`, nullable
- `url` text
- `alt_text` text
- `sort_order` integer
- `is_primary` boolean
- `created_at` timestamptz

#### `product_tags`
Optional taxonomy for filtering.

Fields:
- `id` UUID, PK
- `name` text
- `slug` text, unique
- `created_at` timestamptz

#### `product_tag_links`
Many-to-many link between products and tags.

Fields:
- `product_id` UUID, FK to `products.id`
- `tag_id` UUID, FK to `product_tags.id`
- composite unique index on both columns

#### `product_attributes`
Custom attributes not modeled as fixed columns.

Fields:
- `id` UUID, PK
- `product_id` UUID, FK to `products.id`
- `attribute_name` text
- `attribute_value` text
- `sort_order` integer

### Inventory and Purchasing

#### `warehouses`
Physical or logical stock locations.

Fields:
- `id` UUID, PK
- `name` text
- `code` text, unique
- `type` text, e.g. `main`, `store`, `transit`, `supplier`
- `address_id` UUID, FK to `addresses.id`, nullable
- `is_active` boolean
- `created_at` timestamptz
- `updated_at` timestamptz

#### `stock_levels`
Current stock by variant and warehouse.

Fields:
- `id` UUID, PK
- `warehouse_id` UUID, FK to `warehouses.id`
- `variant_id` UUID, FK to `product_variants.id`
- `on_hand` integer
- `reserved` integer
- `available` integer, generated or maintained
- `low_stock_threshold` integer
- `updated_at` timestamptz

Recommended unique constraint:
- `(warehouse_id, variant_id)`

#### `stock_movements`
Inventory ledger.

Fields:
- `id` UUID, PK
- `warehouse_id` UUID, FK to `warehouses.id`
- `variant_id` UUID, FK to `product_variants.id`
- `movement_type` text, e.g. `purchase_in`, `sale_out`, `adjustment`, `transfer_in`, `transfer_out`, `return_in`
- `quantity` integer
- `reference_type` text, e.g. `purchase_order`, `order`, `sale`, `return`, `manual_adjustment`
- `reference_id` UUID
- `notes` text
- `created_by` UUID, FK to `profiles.id`
- `created_at` timestamptz

#### `stock_reservations`
Temporary reservation of inventory for checkout.

Fields:
- `id` UUID, PK
- `warehouse_id` UUID, FK to `warehouses.id`
- `variant_id` UUID, FK to `product_variants.id`
- `order_id` UUID, FK to `orders.id`, nullable
- `cart_id` UUID, FK to `carts.id`, nullable
- `quantity` integer
- `expires_at` timestamptz
- `created_at` timestamptz

#### `purchase_orders`
Buying stock from suppliers.

Fields:
- `id` UUID, PK
- `supplier_id` UUID, FK to `suppliers.id`
- `warehouse_id` UUID, FK to `warehouses.id`
- `po_number` text, unique
- `status` text, e.g. `draft`, `sent`, `partially_received`, `received`, `cancelled`
- `subtotal` numeric(12,2)
- `tax_total` numeric(12,2)
- `total` numeric(12,2)
- `expected_at` date, nullable
- `created_by` UUID, FK to `profiles.id`
- `created_at` timestamptz
- `updated_at` timestamptz

#### `purchase_order_items`

Fields:
- `id` UUID, PK
- `purchase_order_id` UUID, FK to `purchase_orders.id`
- `variant_id` UUID, FK to `product_variants.id`
- `quantity_ordered` integer
- `quantity_received` integer
- `unit_cost` numeric(12,2)
- `line_total` numeric(12,2)

#### `suppliers`
Suppliers and vendors.

Fields:
- `id` UUID, PK
- `name` text
- `tax_id` text, nullable
- `email` text, nullable
- `phone` text, nullable
- `address_id` UUID, FK to `addresses.id`, nullable
- `notes` text
- `is_active` boolean
- `created_at` timestamptz
- `updated_at` timestamptz

### Customers and CRM

#### `customers`
Customer master record.

Fields:
- `id` UUID, PK
- `user_id` UUID, FK to `profiles.id`, nullable
- `full_name` text
- `email` text, indexed
- `phone` text, nullable
- `birth_date` date, nullable
- `gender` text, nullable
- `marketing_opt_in` boolean
- `created_at` timestamptz
- `updated_at` timestamptz

#### `customer_addresses`
Saved addresses.

Fields:
- `id` UUID, PK
- `customer_id` UUID, FK to `customers.id`
- `label` text, e.g. `Casa`, `Trabajo`
- `recipient_name` text
- `phone` text
- `line1` text
- `line2` text, nullable
- `district` text
- `city` text
- `province` text, nullable
- `region` text, nullable
- `postal_code` text, nullable
- `country_code` text
- `is_default_shipping` boolean
- `is_default_billing` boolean
- `created_at` timestamptz
- `updated_at` timestamptz

#### `customer_tags`
CRM segmentation labels.

Fields:
- `id` UUID, PK
- `name` text
- `slug` text, unique
- `created_at` timestamptz

#### `customer_tag_links`

Fields:
- `customer_id` UUID, FK to `customers.id`
- `tag_id` UUID, FK to `customer_tags.id`

#### `wishlists`
Saved products per customer.

Fields:
- `id` UUID, PK
- `customer_id` UUID, FK to `customers.id`
- `name` text, nullable
- `created_at` timestamptz

#### `wishlist_items`

Fields:
- `id` UUID, PK
- `wishlist_id` UUID, FK to `wishlists.id`
- `variant_id` UUID, FK to `product_variants.id`
- `note` text, nullable
- `created_at` timestamptz

#### `customer_notes`
Internal CRM notes.

Fields:
- `id` UUID, PK
- `customer_id` UUID, FK to `customers.id`
- `note` text
- `created_by` UUID, FK to `profiles.id`
- `created_at` timestamptz

### Orders, Payments, Shipping, and Refunds

## Mock data extraction: `src/data/mockProducts.ts`

This section documents how the current in-repo mock products map to the normalized catalog schema above. Use this as the source of truth to generate the initial `schema.sql` and bulk import scripts.

Source product shape (observed fields):
- `id` (number) — numeric local id in the mock file.
- `name` (string)
- `price` (number) — integer prices in PEN (use `numeric(12,2)` in SQL).
- `available` (boolean)
- `description` (string) — short description.
- `detailedDescription` (string) — long markdown/HTML text.
- `colors` (string[]) — list of color names.
- `sizes` (string[]) — list of size labels.
- `collection` (string) — maps to `collections.name`.
- `images` (string[]) — relative url paths under `/public`.

Mapping strategy to tables
- `products`:
	- `id` => generate UUID (do not import numeric mock id directly as PK)
	- `name` => `name`
	- `slug` => slugified `name` (lowercase, hyphens)
	- `description` => `description`
	- `detailed_description` => `detailedDescription`
	- `status` => map `available: true` -> `active`, otherwise `draft`
	- `collection_id` => map from `collections` by `name`
	- `created_at`, `updated_at` => import as `now()` or a fixed import timestamp

- `collections`:
	- Create if not exists for each unique `collection` string in the mocks (e.g. `SuperStars`, `Romantic`).

- `product_variants`:
	- Normalize each color/size combination into a variant row. If sizes or colors arrays are empty, create a single default variant.
	- `sku` => `yorusito-<mock-id>-<color>-<size>` (simple initial SKU pattern). Example: `yorusito-1-Blanco-S`.
	- `price` => inherit `price` from product (override later per-variant if needed).

- `product_images`:
	- One row per image in `images[]` with `product_id` FK to the created product.
	- Set `is_primary` for the first image in the list.

- `product_attributes` (optional):
	- Store arrays like `colors` and `sizes` redundantly as attribute rows for quick faceting if desired.

Example normalization for mock product `id: 1` (Cristiano v1)

- Source (mock JSON snippet):
	- `id`: 1
	- `name`: "Cristiano v1"
	- `price`: 35
	- `available`: true
	- `colors`: ["Blanco", "Negro"]
	- `sizes`: ["S","M","L"]
	- `collection`: "SuperStars"
	- `images`: ["/images/superstars/cristiano1.png", "/images/superstars/cristiano1-1.png"]

- Normalized rows (conceptual):
	- `collections` row:
		- id: uuid('col-1')
		- name: "SuperStars"
		- slug: "superstars"

	- `products` row:
		- id: uuid('p-1')
		- name: "Cristiano v1"
		- slug: "cristiano-v1"
		- description: "Camiseta de Cristiano Ronaldo, 100% algodón."
		- detailed_description: (long markdown)
		- status: "active"
		- collection_id: uuid('col-1')

	- `product_variants` rows (one per color-size):
		- id: uuid('pv-1-1')
			product_id: uuid('p-1')
			sku: "yorusito-1-Blanco-S"
			color: "Blanco"
			size: "S"
			price: 35.00
		- id: uuid('pv-1-2')
			product_id: uuid('p-1')
			sku: "yorusito-1-Blanco-M"
			color: "Blanco"
			size: "M"
			price: 35.00
		- ... repeat for `Blanco-L`, `Negro-S`, `Negro-M`, `Negro-L`

	- `product_images` rows:
		- id: uuid('img-1-1') product_id: uuid('p-1') url: "/images/superstars/cristiano1.png" is_primary: true
		- id: uuid('img-1-2') product_id: uuid('p-1') url: "/images/superstars/cristiano1-1.png" is_primary: false

Notes and choices
- Use UUIDs for all PKs on import; keep the original numeric `id` in a staging column `legacy_id` if you want traceability.
- Prices in the mock are integers (35) — import as `numeric(12,2)` with `.00` cents.
- The `detailedDescription` contains newlines and markdown; import into a `text` or `jsonb` column depending on whether you want to preserve structure. `text` is simplest.
- Collections should be created first and referenced by `collection_id` when importing products.

Next steps (for SQL generation):
- Generate `CREATE TABLE` statements for `collections`, `products`, `product_variants`, `product_images`, and `product_attributes` following the column mapping above.
- Create a small import script (or `COPY` CSV files) that:
	1. Loads unique collections and captures their UUIDs.
	2. Imports products using `collection_id` lookups.
	3. Generates variants per product (cartesian product of colors × sizes).
	4. Imports images and marks the first image as primary.

## All mock products (extracted from `src/data/mockProducts.ts`)

List of products with key fields (useful for CSV import or verification). Prices are PEN.

- id: 1 — name: Cristiano v1 | collection: SuperStars | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/superstars/cristiano1.png, /images/superstars/cristiano1-1.png, /images/superstars/cristianofront.png]
- id: 2 — name: Cristiano v2 | collection: SuperStars | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/superstars/cristiano2.png, /images/superstars/cristiano2-2.png, /images/superstars/cristianofront.png]
- id: 3 — name: Cristiano v3 | collection: SuperStars | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/superstars/cristiano3.png, /images/superstars/cristiano3-3.png, /images/superstars/cristianofront.png]
- id: 4 — name: Cristiano v4 | collection: SuperStars | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/superstars/cristiano4.png, /images/superstars/cristiano4-4.png, /images/superstars/cristianofront.png]
- id: 5 — name: Messi v1 | collection: SuperStars | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/superstars/messi1.png, /images/superstars/messi1-1.png, /images/superstars/messifront.png]
- id: 6 — name: Ronaldinho v1 | collection: SuperStars | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/superstars/ronaldinho1.png, /images/superstars/ronaldinho1-1.png]
- id: 7 — name: Neymar v1 | collection: SuperStars | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/superstars/neymar1.png, /images/superstars/neymar1-1.png, /images/superstars/neymarfront.png]
- id: 8 — name: Neymar v2 | collection: SuperStars | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/superstars/neymar2.png, /images/superstars/neymar2-2.png, /images/superstars/neymarfront.png]
- id: 9 — name: Neymar v3 | collection: SuperStars | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/superstars/neymar3.png, /images/superstars/neymar3-3.png, /images/superstars/neymarfront.png]
- id: 10 — name: Girlfriend v1 | collection: Romantic | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/girlfriend/girlfriend1.png, /images/girlfriend/girlfriend1-1.png, /images/girlfriend/girlfriendfrontM.png]
- id: 11 — name: Girlfriend v2 | collection: Romantic | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/girlfriend/girlfriend2.png, /images/girlfriend/girlfriend2-2.png, /images/girlfriend/girlfriendfrontM.png]
- id: 12 — name: Girlfriend v3 | collection: Romantic | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/girlfriend/girlfriend3.png, /images/girlfriend/girlfriend3-3.png, /images/girlfriend/girlfriendfrontM.png]
- id: 13 — name: Girlfriend v4 | collection: Romantic | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/girlfriend/girlfriend4.png, /images/girlfriend/girlfriend4-4.png, /images/girlfriend/girlfriendfrontN.png]
- id: 14 — name: Girlfriend v5 | collection: Romantic | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/girlfriend/girlfriend5.png, /images/girlfriend/girlfriend5-5.png, /images/girlfriend/girlfriendfrontN.png]
- id: 16 — name: LEVANTO FIERROS PORQUE CULOS NI UNO | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym1.png]
- id: 17 — name: ADICTO A LAS ROSADITAS | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym2.png]
- id: 18 — name: ABANDONARÍA MIS HIJOS PERO JAMAS A LAS CUARENTONAS | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym3.png]
- id: 19 — name: NO ENTREN AL BAÑO LO TAPÉ | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym4.png]
- id: 20 — name: CAMIONERO A HERENCIA CABRON POR EXPERIENCIA | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym5.png]
- id: 21 — name: YO NO PUBLICO MIS LOGROS PORQUE NO TENGO | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym6.png]
- id: 22 — name: SE LIMPIAN VERGAS CON LA BOCA | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym7.png]
- id: 23 — name: LA CERVEZA FRÍA LAS MUJERES CALIENTES | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym8.png]
- id: 24 — name: DIGA MI NOMBRE CORRECTAMENTE BELLACO | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym9.png]
- id: 25 — name: A MI JEFA DEBO LA VIDA Y A ELECKTRA LA MOTO | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym10.png]
- id: 26 — name: Messi v2 | collection: SuperStars | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/superstars/messi2.png]
- id: 27 — name: Messi v3 | collection: SuperStars | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/superstars/messi3.png, /images/superstars/messifront.png]
- id: 28 — name: Messi v4 | collection: SuperStars | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/superstars/messi4.png, /images/superstars/messifront.png]
- id: 29 — name: Messi v5 | collection: SuperStars | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/superstars/messi5.png, /images/superstars/messifront.png]
- id: 30 — name: EMPECÉ DESDE ABAJO Y AHÍ ME QUEDÉ | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym11.png]
- id: 31 — name: TODO SEA POR LAS SEÑORAS | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym12.png]
- id: 32 — name: MI PASION PRESS BANCA MI DEBILIDAD LA DE RECEPCIÓN | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym13.png]
- id: 33 — name: MAESTRA CÁLLESE A LA VERGA | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym14.png]
- id: 34 — name: TÚ MAMA ES MI CARDIO | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym15.png]
- id: 35 — name: POR FAVOR SÁQUENME DE LATAM | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym17.png]
- id: 36 — name: A LA VERGA QUE HORA ES | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym18.png]
- id: 37 — name: QUÍTENSE ME VOY CAGANDO | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym19.png]
- id: 38 — name: PARA LOS ENVIDIOSOS QUE DIJERON QUE NO PODRÍA LOGRARLO TENÍAN RAZÓN | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym20.png]
- id: 39 — name: MI PASIÓN DÍA DE PIERNA MI DEBILIDAD LOS TREINTONES | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym21.png]
- id: 40 — name: YA ESTUVO SUAVE A LA VERGA TODO | collection: GYM | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/gym/gym22.png]
- id: 41 — name: Messi v6 | collection: SuperStars | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/superstars/messi6.png, /images/superstars/messifront.png]
- id: 42 — name: Messi v7 | collection: SuperStars | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/superstars/messi7.png]
- id: 43 — name: Cristiano v5 | collection: SuperStars | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/superstars/cristiano5.png, /images/superstars/cristianofront.png]
- id: 44 — name: Cristiano v6 | collection: SuperStars | price: 35 | available: true | colors: [Blanco, Negro] | sizes: [S,M,L] | images: [/images/superstars/cristiano6.png, /images/superstars/cristianofront.png]



#### `orders`
Unified order table for online store and manual orders.

Fields:
- `id` UUID, PK
- `order_number` text, unique
- `customer_id` UUID, FK to `customers.id`, nullable for guest checkout
- `channel` text, e.g. `online`, `pos`, `manual`
- `status` text, e.g. `draft`, `pending_payment`, `paid`, `packed`, `shipped`, `delivered`, `cancelled`, `refunded`
- `fulfillment_status` text
- `payment_status` text
- `currency` text
- `subtotal` numeric(12,2)
- `discount_total` numeric(12,2)
- `shipping_total` numeric(12,2)
- `tax_total` numeric(12,2)
- `total` numeric(12,2)
- `billing_address_id` UUID, FK to `customer_addresses.id`, nullable
- `shipping_address_id` UUID, FK to `customer_addresses.id`, nullable
- `sales_rep_id` UUID, FK to `profiles.id`, nullable
- `source` text, nullable, e.g. `web`, `instagram`, `whatsapp`, `store`
- `notes` text, nullable
- `placed_at` timestamptz, nullable
- `created_at` timestamptz
- `updated_at` timestamptz
- `deleted_at` timestamptz, nullable

Notes for the current sales modal mapping:
- `channel`: stays as-is.
- `customer`: full customer name shown in the admin form.
- `amount`: total amount.
- `status`: stays as-is.
- `order_number`: generated automatically the first time the sale is saved.
- `customer_id`: id of the already created customer record.
- `currency`: `SOLES` or `DOLARES`.
- `subtotal`: amount before IGV.
- `discount_total`: total discount applied.
- `shipping_total`: shipping cost.
- `tax_total`: total IGV.
- `sales_rep_id`: id of the seller.
- `shipping_address_id`: shipping identifier, tied to the district and client address.

#### `order_items`
Order lines.

Fields:
- `id` UUID, PK
- `order_id` UUID, FK to `orders.id`
- `variant_id` UUID, FK to `product_variants.id`
- `product_name_snapshot` text
- `variant_name_snapshot` text, nullable
- `sku_snapshot` text, nullable
- `unit_price` numeric(12,2)
- `quantity` integer
- `discount_amount` numeric(12,2)
- `tax_amount` numeric(12,2)
- `line_total` numeric(12,2)

#### `order_status_history`
Full order lifecycle audit.

Fields:
- `id` UUID, PK
- `order_id` UUID, FK to `orders.id`
- `from_status` text, nullable
- `to_status` text
- `changed_by` UUID, FK to `profiles.id`, nullable
- `notes` text, nullable
- `created_at` timestamptz

#### `payments`
Payments applied to orders.

Fields:
- `id` UUID, PK
- `order_id` UUID, FK to `orders.id`
- `provider` text, e.g. `cash`, `card`, `yape`, `plin`, `stripe`, `paypal`
- `payment_method` text
- `status` text, e.g. `pending`, `authorized`, `paid`, `failed`, `refunded`, `partially_refunded`
- `amount` numeric(12,2)
- `transaction_reference` text, nullable
- `paid_at` timestamptz, nullable
- `created_at` timestamptz
- `updated_at` timestamptz

#### `refunds`
Refund management.

Fields:
- `id` UUID, PK
- `payment_id` UUID, FK to `payments.id`
- `order_id` UUID, FK to `orders.id`
- `amount` numeric(12,2)
- `reason` text
- `status` text, e.g. `requested`, `approved`, `rejected`, `processed`
- `processed_by` UUID, FK to `profiles.id`, nullable
- `created_at` timestamptz
- `updated_at` timestamptz

#### `shipments`
Logistics and delivery tracking.

Fields:
- `id` UUID, PK
- `order_id` UUID, FK to `orders.id`
- `carrier` text, nullable
- `service_level` text, nullable
- `tracking_number` text, nullable
- `status` text, e.g. `pending`, `picked_up`, `in_transit`, `delivered`, `returned`
- `shipped_at` timestamptz, nullable
- `delivered_at` timestamptz, nullable
- `shipping_cost` numeric(12,2)
- `created_at` timestamptz
- `updated_at` timestamptz

#### `carts`
Shopping carts for online customers.

Fields:
- `id` UUID, PK
- `customer_id` UUID, FK to `customers.id`, nullable
- `session_key` text, unique or indexed for guests
- `status` text, e.g. `active`, `converted`, `abandoned`
- `channel` text, usually `online`
- `created_at` timestamptz
- `updated_at` timestamptz

#### `cart_items`

Fields:
- `id` UUID, PK
- `cart_id` UUID, FK to `carts.id`
- `variant_id` UUID, FK to `product_variants.id`
- `quantity` integer
- `unit_price_snapshot` numeric(12,2)
- `created_at` timestamptz
- `updated_at` timestamptz

### POS and Cash Management

#### `pos_registers`
Physical or logical cash registers.

Fields:
- `id` UUID, PK
- `name` text
- `code` text, unique
- `warehouse_id` UUID, FK to `warehouses.id`, nullable
- `is_active` boolean
- `created_at` timestamptz
- `updated_at` timestamptz

#### `pos_sessions`
Cashier sessions or shifts.

Fields:
- `id` UUID, PK
- `register_id` UUID, FK to `pos_registers.id`
- `cashier_id` UUID, FK to `profiles.id`
- `opened_at` timestamptz
- `closed_at` timestamptz, nullable
- `opening_cash` numeric(12,2)
- `closing_cash` numeric(12,2), nullable
- `status` text, e.g. `open`, `closed`, `reconciled`
- `notes` text, nullable

#### `pos_transactions`
POS-level sales, refunds, and cash movements.

Fields:
- `id` UUID, PK
- `pos_session_id` UUID, FK to `pos_sessions.id`
- `order_id` UUID, FK to `orders.id`, nullable
- `type` text, e.g. `sale`, `refund`, `cash_in`, `cash_out`
- `amount` numeric(12,2)
- `payment_method` text
- `reference` text, nullable
- `created_at` timestamptz

#### `cash_movements`
Cash drawer operations.

Fields:
- `id` UUID, PK
- `pos_session_id` UUID, FK to `pos_sessions.id`, nullable
- `movement_type` text, e.g. `open`, `close`, `deposit`, `withdrawal`, `adjustment`
- `amount` numeric(12,2)
- `reason` text, nullable
- `created_by` UUID, FK to `profiles.id`
- `created_at` timestamptz

### Contacts and Support

#### `contact_messages`
Public contact form submissions.

Fields:
- `id` UUID, PK
- `name` text
- `email` text
- `phone` text, nullable
- `subject` text, nullable
- `message` text
- `source` text, e.g. `contact_form`, `whatsapp`, `instagram`
- `status` text, e.g. `new`, `in_progress`, `closed`
- `assigned_to` UUID, FK to `profiles.id`, nullable
- `created_at` timestamptz
- `updated_at` timestamptz

#### `support_tickets`
Structured support tracking.

Fields:
- `id` UUID, PK
- `customer_id` UUID, FK to `customers.id`, nullable
- `contact_message_id` UUID, FK to `contact_messages.id`, nullable
- `ticket_number` text, unique
- `priority` text, e.g. `low`, `medium`, `high`, `urgent`
- `status` text, e.g. `open`, `pending`, `resolved`, `closed`
- `subject` text
- `description` text
- `assigned_to` UUID, FK to `profiles.id`, nullable
- `created_at` timestamptz
- `updated_at` timestamptz

#### `support_ticket_messages`
Conversation thread for tickets.

Fields:
- `id` UUID, PK
- `ticket_id` UUID, FK to `support_tickets.id`
- `sender_type` text, e.g. `customer`, `staff`
- `sender_id` UUID, nullable
- `message` text
- `attachments` jsonb, nullable
- `created_at` timestamptz

### Store Configuration

#### `store_settings`
Global store settings.

Fields:
- `id` UUID, PK
- `store_name` text
- `store_slug` text, unique
- `currency_code` text
- `timezone` text
- `support_email` text
- `support_phone` text
- `logo_url` text, nullable
- `favicon_url` text, nullable
- `primary_color` text, nullable
- `secondary_color` text, nullable
- `is_store_open` boolean
- `maintenance_mode` boolean
- `created_at` timestamptz
- `updated_at` timestamptz

#### `shipping_zones`
Shipping regions.

Fields:
- `id` UUID, PK
- `name` text
- `country_code` text
- `regions` jsonb, nullable
- `base_rate` numeric(12,2)
- `free_shipping_threshold` numeric(12,2), nullable
- `is_active` boolean
- `created_at` timestamptz
- `updated_at` timestamptz

#### `tax_rates`
Optional tax configuration.

Fields:
- `id` UUID, PK
- `name` text
- `rate` numeric(6,4)
- `country_code` text
- `region_code` text, nullable
- `is_active` boolean
- `created_at` timestamptz

#### `payment_methods`
Configured payment methods.

Fields:
- `id` UUID, PK
- `name` text
- `provider` text
- `is_online_enabled` boolean
- `is_pos_enabled` boolean
- `is_active` boolean
- `created_at` timestamptz
- `updated_at` timestamptz

#### `discounts`
Promotions and campaigns.

Fields:
- `id` UUID, PK
- `name` text
- `code` text, unique, nullable
- `discount_type` text, e.g. `percentage`, `fixed_amount`, `free_shipping`
- `value` numeric(12,2)
- `starts_at` timestamptz, nullable
- `ends_at` timestamptz, nullable
- `usage_limit` integer, nullable
- `usage_count` integer
- `is_active` boolean
- `created_at` timestamptz
- `updated_at` timestamptz

#### `discount_redemptions`

Fields:
- `id` UUID, PK
- `discount_id` UUID, FK to `discounts.id`
- `order_id` UUID, FK to `orders.id`
- `customer_id` UUID, FK to `customers.id`, nullable
- `redeemed_at` timestamptz

### Analytics and Admin Dashboard

Use views or materialized views for dashboard data instead of duplicate tables.

Recommended views:

#### `vw_sales_daily`
Daily sales summary by date and channel.

Suggested columns:
- `sale_date`
- `channel`
- `orders_count`
- `gross_sales`
- `discounts`
- `net_sales`
- `refunds`
- `profit_estimate`

#### `vw_inventory_status`
Current inventory health.

Suggested columns:
- `warehouse_id`
- `variant_id`
- `sku`
- `product_name`
- `on_hand`
- `reserved`
- `available`
- `low_stock_flag`

#### `vw_top_products`
Best sellers by period.

Suggested columns:
- `variant_id`
- `product_id`
- `product_name`
- `units_sold`
- `revenue`
- `period`

#### `vw_customer_lifetime_value`
Customer value over time.

Suggested columns:
- `customer_id`
- `orders_count`
- `lifetime_value`
- `last_order_at`
- `average_order_value`

## Relationship Summary

- A `product` belongs to one `category`, optionally one `collection` and one `brand`.
- A `product` has many `product_variants`.
- A `product_variant` has many `product_images`.
- A `product_variant` has stock in many `warehouses` through `stock_levels`.
- A `customer` may have many `addresses`, `wishlists`, `orders`, and `support_tickets`.
- An `order` has many `order_items`, `payments`, `shipments`, and status history records.
- A `pos_session` belongs to one cashier and one register.
- A `contact_message` can become a `support_ticket`.
- A `discount` can be redeemed many times, but each redemption is linked to one order.

## Recommended Indexes

- `profiles.email`
- `categories.slug`
- `collections.slug`
- `products.slug`
- `products.category_id`
- `products.collection_id`
- `product_variants.sku`
- `product_variants.barcode`
- `stock_levels(warehouse_id, variant_id)` unique
- `customers.email`
- `orders.order_number` unique
- `orders.customer_id`
- `orders.channel`
- `orders.status`
- `payments.order_id`
- `stock_movements.variant_id`
- `stock_movements.warehouse_id`
- `contact_messages.status`
- `support_tickets.ticket_number` unique

## RLS Strategy for Supabase

Suggested policies:

- Public users can read active products, categories, collections, images, and store settings needed by the storefront.
- Customers can read and update their own profile, addresses, wishlists, carts, and orders.
- Staff can access inventory, orders, POS, contacts, and analytics according to role.
- Only admins can manage settings, roles, discounts, tax rates, shipping zones, and product catalog writes.
- Cashiers can create POS sales and view active registers and sessions.
- Warehouse users can adjust stock and receive purchase orders.

## Suggested Channel Logic

Instead of separate systems, use one commerce core:

- `channel = online` for ecommerce checkout.
- `channel = pos` for in-store checkout.
- `channel = manual` for backoffice-created sales.
- `source` can capture the origin such as `web`, `whatsapp`, `instagram`, `store`.

This keeps reporting consistent across all sales points.

## Practical Supabase Notes

- Use triggers to update `updated_at`.
- Use database functions for reserved stock cleanup.
- Use views for admin KPIs.
- Use soft delete only where historical integrity matters.
- Keep product snapshots in `order_items` so future catalog edits do not alter past orders.
- Store money values in `numeric(12,2)`.
- Store system events in audit tables if you need traceability later.

## Optional Future Tables

- `audit_logs`
- `activity_events`
- `notifications`
- `email_templates`
- `sms_logs`
- `api_keys`
- `webhooks`
- `returns`
- `exchanges`
- `gift_cards`
- `banners`
- `content_pages`

## Summary

This model is built to grow from a simple store into a full ecommerce operation with admin, POS, inventory, contact management, and analytics.
The safest path in Supabase is to keep the transactional core unified and expose dashboards through views.
