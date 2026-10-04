import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowLeft, Check, Dog, ExternalLink } from "lucide-react";

const PROD_BASE = "https://www.ezwhelp.com";

export interface CartReviewItem {
  name: string;
  url: string;
  imageUrl?: string;
  description?: string;
  required?: boolean;
}

export interface CartReviewScreenProps {
  items: CartReviewItem[];
  heading?: string;
  subheading?: string;
  onBack: () => void;
}

function extractVariantId(url: string | undefined): string | null {
  if (!url) return null;
  const m = url.match(/[?&]variant=(\d+)/);
  return m ? m[1] : null;
}

function buildShopifyCartUrl(items: CartReviewItem[]): string {
  const variantParts = items
    .map((i) => extractVariantId(i.url))
    .filter((v): v is string => Boolean(v))
    .map((v) => `${v}:1`);
  if (variantParts.length === 0) return `${PROD_BASE}/cart`;
  return `${PROD_BASE}/cart/${variantParts.join(",")}`;
}

const CartReviewScreen: React.FC<CartReviewScreenProps> = ({
  items,
  heading = "Review Your Cart",
  subheading = "Uncheck anything you don't need before heading to checkout.",
  onBack,
}) => {
  const [checked, setChecked] = useState<Record<number, boolean>>(() =>
    items.reduce<Record<number, boolean>>((acc, _item, idx) => {
      acc[idx] = true;
      return acc;
    }, {})
  );

  const toggle = (idx: number, required?: boolean) => {
    if (required) return;
    setChecked((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const selectedItems = useMemo(
    () => items.filter((_, idx) => checked[idx]),
    [items, checked]
  );

  const itemsWithVariant = useMemo(
    () => selectedItems.filter((i) => extractVariantId(i.url)),
    [selectedItems]
  );

  const cartUrl = useMemo(
    () => buildShopifyCartUrl(itemsWithVariant),
    [itemsWithVariant]
  );

  const cartCount = itemsWithVariant.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-2xl lg:max-w-3xl mx-auto px-3 md:px-6 pt-6 md:pt-10 pb-32"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs md:text-sm font-display font-semibold mb-4 transition-colors hover:opacity-80"
        style={{ color: "#8A6F4E", background: "transparent", border: "none" }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Recommendations
      </button>

      <div className="text-center mb-5 md:mb-7">
        <h2
          className="text-xl md:text-2xl lg:text-3xl font-display font-black"
          style={{ color: "#5A4A3A" }}
        >
          {heading}
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground font-medium mt-1.5 px-2">
          {subheading}
        </p>
      </div>

      <div className="space-y-2.5 md:space-y-3">
        {items.map((item, idx) => {
          const isChecked = !!checked[idx];
          const isRequired = !!item.required;
          const hasVariant = !!extractVariantId(item.url);
          return (
            <motion.div
              key={`${item.name}-${idx}`}
              onClick={() => toggle(idx, isRequired)}
              className="duo-card px-3 py-3 md:px-4 md:py-4 flex items-center gap-3 md:gap-4 transition-all duration-200"
              style={{
                border:
                  "1.5px solid " + (isChecked ? "#D46A3A" : "#E8DDD0"),
                background: isChecked ? "#FFF8F2" : "#F7F3EC",
                opacity: isChecked ? 1 : 0.55,
                cursor: isRequired ? "default" : "pointer",
              }}
              whileHover={isRequired ? undefined : { scale: 1.01, y: -1 }}
              whileTap={isRequired ? undefined : { scale: 0.99 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: isChecked ? 1 : 0.55, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.25 }}
            >
              <div
                className="w-6 h-6 md:w-7 md:h-7 rounded-md flex items-center justify-center shrink-0 transition-colors"
                style={{
                  background: isChecked ? "#D46A3A" : "transparent",
                  border:
                    "2px solid " +
                    (isChecked ? "#D46A3A" : "#C4A67A"),
                }}
              >
                {isChecked && (
                  <Check
                    className="w-4 h-4 md:w-5 md:h-5"
                    style={{ color: "#FFFFFF" }}
                    strokeWidth={3}
                  />
                )}
              </div>

              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-xl object-cover shrink-0"
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                />
              ) : (
                <div
                  className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #EFE6DA 0%, #E5D9C8 100%)",
                  }}
                >
                  <Dog className="w-5 h-5 md:w-6 md:h-6" style={{ color: "#8A6F4E" }} />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <span
                  className="font-display font-bold text-sm md:text-base block"
                  style={{ color: "#5A4A3A" }}
                >
                  {item.name}
                  {isRequired && (
                    <span
                      className="ml-2 text-[9px] md:text-[10px] font-bold uppercase align-middle px-1.5 py-0.5 rounded"
                      style={{ color: "#D46A3A", background: "#FDF0E7" }}
                    >
                      Included
                    </span>
                  )}
                </span>
                {item.description && (
                  <span className="block text-[11px] md:text-xs text-muted-foreground font-medium mt-0.5">
                    {item.description}
                  </span>
                )}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[10px] md:text-[11px] font-semibold mt-1 no-underline hover:underline"
                    style={{ color: "#8A6F4E" }}
                  >
                    Open product page <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "rgba(250,246,240,0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 -4px 30px rgba(0,0,0,0.1)",
        }}
      >
        <div className="max-w-2xl lg:max-w-3xl mx-auto px-4 py-3 md:py-4">
          <a
            href={cartUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block no-underline"
            onClick={(e) => {
              if (cartCount === 0) e.preventDefault();
            }}
            aria-disabled={cartCount === 0}
          >
            <button
              disabled={cartCount === 0}
              className="w-full font-display font-black text-[13px] md:text-sm h-11 md:h-12 flex items-center justify-center gap-2 transition-all"
              style={{
                borderRadius: "12px",
                background:
                  cartCount > 0
                    ? "linear-gradient(135deg, #D46A3A 0%, #C4531A 100%)"
                    : "#D8CFC2",
                color: "#FFFFFF",
                opacity: cartCount > 0 ? 1 : 0.6,
                boxShadow:
                  cartCount > 0
                    ? "0 3px 14px rgba(212,106,58,0.35), inset 0 1px 0 rgba(255,255,255,0.15)"
                    : "none",
                letterSpacing: "0.02em",
                cursor: cartCount > 0 ? "pointer" : "not-allowed",
              }}
            >
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
              Proceed to Checkout ({cartCount} item
              {cartCount === 1 ? "" : "s"})
            </button>
          </a>
          <div className="text-center pt-1.5">
            <span
              className="text-[9px] md:text-[10px] font-bold"
              style={{ color: "#B5ADA3" }}
            >
              Free Shipping • Secure Checkout
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CartReviewScreen;
