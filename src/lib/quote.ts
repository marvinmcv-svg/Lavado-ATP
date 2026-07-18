// Quote calculator estimate logic (Step 3.9).
// Computes an estimated price RANGE from a service's base price and the
// admin-editable tier multipliers in site_settings.quote_calculator_config.
// Never returns a guaranteed fixed price — always a range.

export interface QuoteTier {
  label: string;
  labelEn: string;
  sqmMax: number; // upper bound of this tier (sqm)
  multiplier: number;
}

export interface QuoteConfig {
  tiers: QuoteTier[];
}

export const DEFAULT_QUOTE_CONFIG: QuoteConfig = {
  tiers: [
    { label: "Pequeño", labelEn: "Small", sqmMax: 50, multiplier: 1.0 },
    { label: "Mediano", labelEn: "Medium", sqmMax: 150, multiplier: 1.6 },
    { label: "Grande", labelEn: "Large", sqmMax: 400, multiplier: 2.8 },
    { label: "Muy grande", labelEn: "X-Large", sqmMax: 100000, multiplier: 4.5 },
  ],
};

export interface SizePreset {
  id: string;
  labelEs: string;
  labelEn: string;
  sqm: number;
  icon: string;
}

export const SIZE_PRESETS: SizePreset[] = [
  { id: "small", labelEs: "Pequeño", labelEn: "Small", sqm: 30, icon: "home" },
  { id: "medium", labelEs: "Mediano", labelEn: "Medium", sqm: 100, icon: "building" },
  { id: "large", labelEs: "Grande", labelEn: "Large", sqm: 250, icon: "factory" },
];

export interface QuoteEstimate {
  low: number;
  high: number;
  tierLabel: string;
  tierLabelEn: string;
  currency: string;
}

/**
 * Compute an estimate range. A ±15% band is applied around the computed
 * midpoint so the UI always shows a *range*, never a single guaranteed price.
 */
export function computeEstimate(opts: {
  basePrice: number;
  sqm: number;
  config: QuoteConfig;
  currency: string;
}): QuoteEstimate {
  const { basePrice, sqm, config, currency } = opts;
  const tiers = config.tiers?.length ? config.tiers : DEFAULT_QUOTE_CONFIG.tiers;
  const tier = tiers.find((t) => sqm <= t.sqmMax) ?? tiers[tiers.length - 1];
  const midpoint = basePrice * tier.multiplier;
  const band = midpoint * 0.15;
  return {
    low: Math.round((midpoint - band) / 10) * 10,
    high: Math.round((midpoint + band) / 10) * 10,
    tierLabel: tier.label,
    tierLabelEn: tier.labelEn,
    currency,
  };
}

export function formatPrice(amount: number, currency: string): string {
  const symbol =
    currency === "BOB" ? "Bs" :
    currency === "USD" ? "$" :
    currency === "ARS" ? "$" :
    currency === "PEN" ? "S/" :
    currency === "CLP" ? "$" : currency;
  return `${symbol} ${amount.toLocaleString("es-BO")}`;
}
