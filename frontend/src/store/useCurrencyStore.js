import { create } from "zustand";
import { persist } from "zustand/middleware";

export const CURRENCIES = {
  USD: { code: "USD", symbol: "$", rate: 1.0, name: "US Dollar", nameAr: "دولار أمريكي", decimals: 2 },
  EUR: { code: "EUR", symbol: "€", rate: 0.92, name: "Euro", nameAr: "يورو", decimals: 2 },
  GBP: { code: "GBP", symbol: "£", rate: 0.79, name: "British Pound", nameAr: "جنيه إسترليني", decimals: 2 },
  SAR: { code: "SAR", symbol: "ر.س", rate: 3.75, name: "Saudi Riyal", nameAr: "ريال سعودي", decimals: 0 },
  AED: { code: "AED", symbol: "د.إ", rate: 3.67, name: "UAE Dirham", nameAr: "درهم إماراتي", decimals: 0 },
  IQD: { code: "IQD", symbol: "د.ع", rate: 1310.0, name: "Iraqi Dinar", nameAr: "دينار عراقي", decimals: 0 },
};

export const useCurrencyStore = create(
  persist(
    (set, get) => ({
      currentCurrency: "USD",

      setCurrency: (code) => {
        if (CURRENCIES[code]) {
          set({ currentCurrency: code });
        }
      },

      convert: (basePriceUSD) => {
        const curr = CURRENCIES[get().currentCurrency] || CURRENCIES.USD;
        return Number(basePriceUSD) * curr.rate;
      },
    }),
    { name: "vrital-currency" }
  )
);
