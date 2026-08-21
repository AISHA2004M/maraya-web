/**
 * Dynamic Multi-Currency Price Formatting Engine
 * ================================================
 * Converts and formats prices seamlessly across global currencies:
 * USD ($), EUR (€), GBP (£), SAR (ر.س), AED (د.إ), IQD (د.ع).
 */
import { useCurrencyStore, CURRENCIES } from "../store/useCurrencyStore";

export function formatPrice(priceInUSD) {
  const num = Number(priceInUSD);
  if (isNaN(num)) return "$0.00";

  const { currentCurrency } = useCurrencyStore.getState();
  const curr = CURRENCIES[currentCurrency] || CURRENCIES.USD;
  const converted = num * curr.rate;

  if (curr.code === "USD") {
    return `$${converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (curr.code === "EUR") {
    return `€${converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (curr.code === "GBP") {
    return `£${converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return `${converted.toLocaleString("en-US", { maximumFractionDigits: curr.decimals })} ${curr.symbol}`;
}

export const SHIPPING_THRESHOLD = 150; // $150 USD baseline
export const SHIPPING_COST = 15;        // $15 USD baseline

export function getShippingCost(subtotalUSD) {
  return subtotalUSD >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
}

export function formatShipping(subtotalUSD) {
  const cost = getShippingCost(subtotalUSD);
  return cost === 0 ? "FREE" : formatPrice(cost);
}
