/**
 * Price formatting utilities for Iraqi Dinar (IQD)
 * =================================================
 * Centralizes all currency display logic so every page
 * shows prices consistently in the Iraqi market format.
 */

/**
 * Format a price value as Iraqi Dinar.
 * @param {number|string} price — The raw price value
 * @returns {string} — Formatted price string, e.g. "132,000 د.ع"
 */
export function formatPrice(price) {
  const num = Number(price);
  if (isNaN(num)) return "0 د.ع";
  return `${num.toLocaleString("en-US", { maximumFractionDigits: 0 })} د.ع`;
}

/**
 * Format shipping cost for Iraqi market.
 * Free shipping threshold: 150,000 IQD
 * Standard shipping: 5,000 IQD
 */
export const SHIPPING_THRESHOLD = 150000; // Free shipping above this
export const SHIPPING_COST = 5000;        // Standard shipping in IQD

export function getShippingCost(subtotal) {
  return subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
}

export function formatShipping(subtotal) {
  const cost = getShippingCost(subtotal);
  return cost === 0 ? "مجاني" : formatPrice(cost);
}
