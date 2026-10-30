"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isNewArrival, type StorefrontProduct, type StorefrontProductDetail } from "@/lib/storefront-products";
import { colorToHex } from "@/lib/catalog/catalog-utils";
import { findVariantStock } from "@/lib/product-stock";
import { useProductStock } from "@/hooks/useProductStock";
import { useCart } from "@/components/cart/CartProvider";
import { buildSingleItemWhatsappText, cartLineKey, whatsappUrl } from "@/lib/cart";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faTimes } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

const SIZE_GUIDE = [
  { size: "XS", width: "49", length: "61" },
  { size: "S", width: "52", length: "70" },
  { size: "M", width: "55", length: "73" },
  { size: "L", width: "58", length: "76" },
  { size: "XL", width: "62", length: "81" },
  { size: "XXL", width: "64", length: "86" },
];

type ProductDetailsProps = {
  product: StorefrontProductDetail;
  related?: StorefrontProduct[];
};

export default function ProductDetails({ product, related = [] }: ProductDetailsProps) {
  const router = useRouter();
  const relatedProducts = related;
  const [selectedColor, setSelectedColor] = useState<string | null>(product.colors[0] ?? null);
  const [selectedSize, setSelectedSize] = useState<string | null>(product.sizes[0] ?? null);
  const [currentImage, setCurrentImage] = useState<string | null>(product.images[0] ?? null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [cartNotice, setCartNotice] = useState<string | null>(null);

  useEffect(() => {
    setSelectedColor(product.colors[0] ?? null);
    setSelectedSize(product.sizes[0] ?? null);
    setCurrentImage(product.images[0] ?? null);
    setQuantity(1);
  }, [product.id, product.colors, product.sizes, product.images]);

  useEffect(() => {
    if (!cartNotice) return;
    const timeout = window.setTimeout(() => setCartNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [cartNotice]);
  const { stock, loading: stockLoading } = useProductStock();
  const { addItem, lines } = useCart();

  const productStock = stock[product.id];
  const selectedVariantStock = findVariantStock(productStock, selectedColor, selectedSize);
  const availableUnits = selectedVariantStock?.available ?? productStock?.available ?? 0;
  const stockKnown = Boolean(productStock);
  const canBuy = Boolean(selectedColor && selectedSize && !stockLoading && stockKnown && availableUnits > 0);

  useEffect(() => {
    if (stockKnown && availableUnits > 0 && quantity > availableUnits) {
      setQuantity(availableUnits);
    }
  }, [availableUnits, quantity, stockKnown]);

  const currentLine =
    product && selectedColor && selectedSize
      ? {
          productId: product.id,
          name: product.name,
          price: product.price,
          image: currentImage || product.images[0] || "",
          color: selectedColor,
          size: selectedSize,
          quantity,
        }
      : null;

  const addCurrentToCart = () => {
    if (!canBuy || !currentLine) return false;

    const existing = lines.find((line) => cartLineKey(line) === cartLineKey(currentLine));
    const room = availableUnits - (existing?.quantity ?? 0);
    if (room <= 0) {
      setCartNotice("Ya tienes el máximo disponible en el carrito.");
      return false;
    }

    addItem(currentLine, availableUnits);
    setCartNotice(room < currentLine.quantity ? "Agregamos hasta el stock disponible." : "Agregado al carrito.");
    return true;
  };

  const goToCheckout = () => {
    if (!canBuy || !currentLine) return;

    const existing = lines.find((line) => cartLineKey(line) === cartLineKey(currentLine));
    const room = availableUnits - (existing?.quantity ?? 0);
    if (room > 0) addItem(currentLine, availableUnits);
    router.push("/checkout");
  };

  const whatsappHref = currentLine ? whatsappUrl(buildSingleItemWhatsappText(currentLine)) : whatsappUrl("Hola, quiero hacer un pedido.");

  return (
    <main className="min-h-screen bg-zinc-50 pt-20 text-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-950"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          Volver
        </button>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <button
              type="button"
              onClick={() => setModalImage(currentImage || product.images[0])}
              className="group relative block w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white"
            >
              <img
                src={currentImage || product.images[0]}
                alt={product.name}
                className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.02]"
              />
              {stockKnown && availableUnits <= 0 ? (
                <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Sin stock
                </span>
              ) : null}
            </button>

            {product.images.length > 1 ? (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {product.images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setCurrentImage(image)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition ${
                      currentImage === image ? "border-zinc-950" : "border-zinc-200 hover:border-zinc-400"
                    }`}
                  >
                    <img src={image} alt={`Vista ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-400">
              {product.subcollection || product.collection}
            </p>
            {isNewArrival(product.createdAt) ? (
              <span className="mt-3 inline-flex rounded-full bg-zinc-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                Nuevo
              </span>
            ) : null}
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{product.name}</h1>
            <p className="mt-4 text-sm leading-7 text-zinc-600">{product.seoDescription || product.summary}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <p className="text-3xl font-bold text-zinc-950">S/ {product.price.toFixed(2)}</p>
              {stockLoading ? (
                <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600">
                  Revisando stock...
                </span>
              ) : stockKnown ? (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    availableUnits > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {availableUnits > 0 ? `${availableUnits} disponibles` : "Sin stock"}
                </span>
              ) : null}
            </div>

            <div className="mt-8 space-y-6 border-t border-zinc-200 pt-8">
              <div>
                <p className="text-sm font-medium text-zinc-700">Color · {selectedColor}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                        selectedColor === color
                          ? "border-zinc-950 bg-zinc-950 text-white"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
                      }`}
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-zinc-200"
                        style={{ backgroundColor: colorToHex(color) }}
                      />
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-zinc-700">Talla · {selectedSize}</p>
                  <button
                    type="button"
                    onClick={() => setShowSizeGuide((open) => !open)}
                    className="text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-950"
                  >
                    {showSizeGuide ? "Ocultar guía" : "Guía de tallas"}
                  </button>
                </div>

                {showSizeGuide ? (
                  <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm">
                    <p className="text-zinc-600">
                      Nuestras tallas son completas y hechas para la satisfacción de nuestros clientes.
                    </p>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[240px]">
                        <thead>
                          <tr className="border-b border-zinc-200 text-left text-zinc-500">
                            <th className="pb-2 pr-4 font-medium">Talla</th>
                            <th className="pb-2 pr-4 font-medium">Ancho (cm)</th>
                            <th className="pb-2 font-medium">Largo (cm)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {SIZE_GUIDE.map((row) => (
                            <tr key={row.size} className="border-b border-zinc-100 last:border-0">
                              <td className="py-2 pr-4 font-medium">{row.size}</td>
                              <td className="py-2 pr-4">{row.width}</td>
                              <td className="py-2">{row.length}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-3 text-xs text-zinc-400">Medidas referenciales.</p>
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const sizeAvailable =
                      !stockKnown || (findVariantStock(productStock, selectedColor, size)?.available ?? 0) > 0;

                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={!sizeAvailable}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[3rem] rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:border-zinc-100 disabled:bg-zinc-100 disabled:text-zinc-400 ${
                          selectedSize === size
                            ? "border-zinc-950 bg-zinc-950 text-white"
                            : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-700">Cantidad</p>
                <div className="mt-3 inline-flex items-center rounded-xl border border-zinc-200 bg-white">
                  <button
                    type="button"
                    className="px-4 py-2.5 text-lg disabled:text-zinc-300"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  >
                    −
                  </button>
                  <span className="min-w-[3rem] border-x border-zinc-200 px-4 py-2.5 text-center text-sm font-semibold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="px-4 py-2.5 text-lg disabled:text-zinc-300"
                    disabled={stockKnown && quantity >= availableUnits}
                    onClick={() =>
                      setQuantity((current) => (stockKnown ? Math.min(availableUnits, current + 1) : current + 1))
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={addCurrentToCart}
                disabled={!canBuy}
                className="w-full rounded-xl bg-zinc-950 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
              >
                {stockLoading ? "Revisando stock..." : stockKnown && availableUnits <= 0 ? "Sin stock" : "Agregar al carrito"}
              </button>

              <button
                type="button"
                onClick={goToCheckout}
                disabled={!canBuy}
                className="w-full rounded-xl border border-zinc-950 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-950 transition hover:bg-zinc-950 hover:text-white disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-transparent disabled:text-zinc-400"
              >
                Ir al checkout
              </button>

              <a
                href={canBuy ? whatsappHref : undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!canBuy}
                tabIndex={canBuy ? undefined : -1}
                onClick={(event) => {
                  if (!canBuy) event.preventDefault();
                }}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-semibold uppercase tracking-[0.14em] transition ${
                  canBuy
                    ? "border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white"
                    : "pointer-events-none border-zinc-200 text-zinc-400"
                }`}
              >
                <FontAwesomeIcon icon={faWhatsapp} />
                Comprar por WhatsApp
              </a>

              {cartNotice ? (
                <p className="text-center text-sm text-zinc-700">
                  {cartNotice}{" "}
                  <Link href="/cart" className="font-semibold underline">
                    Ver carrito
                  </Link>
                </p>
              ) : null}

              {!canBuy && !stockLoading ? (
                <p className="text-center text-xs text-zinc-500">
                  {stockKnown && availableUnits <= 0
                    ? "Prueba otro color o talla."
                    : "Elige color y talla para continuar."}
                </p>
              ) : null}

              <p className="text-center text-xs text-zinc-400">
                ✎ También puedes personalizar este diseño. Escríbenos por WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {product.description ? (
          <section className="mt-16 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-zinc-950">Descripción</h2>
            <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-600">
              {product.description}
            </div>
          </section>
        ) : null}

        {relatedProducts.length > 0 ? (
          <section className="mt-16">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-400">También te puede gustar</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Más de {product.collection}</h2>
              </div>
              <Link href="/products" className="text-sm font-medium text-zinc-500 hover:text-zinc-950">
                Ver todos
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.parentSku}
                  href={relatedProduct.path}
                  title={relatedProduct.seoDescription}
                  className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-zinc-300 hover:shadow-md"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-zinc-100">
                    <img
                      src={relatedProduct.images[0]}
                      alt={relatedProduct.seoTitle || relatedProduct.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-1 text-sm font-medium text-zinc-950">{relatedProduct.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{relatedProduct.seoDescription}</p>
                    <p className="mt-1 text-sm font-bold text-zinc-950">S/ {relatedProduct.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {modalImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setModalImage(null)}
          onKeyDown={(event) => event.key === "Escape" && setModalImage(null)}
          role="presentation"
        >
          <button
            type="button"
            onClick={() => setModalImage(null)}
            className="absolute right-4 top-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
            aria-label="Cerrar"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
          <img
            src={modalImage}
            alt={product.name}
            className="max-h-[85vh] max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </main>
  );
}
