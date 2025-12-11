/**
 * Meter Brand Colors
 * Use these for consistent branding across components
 */

export const METER_COLORS = {
  /** Deep blue/navy - headings, buttons, main text */
  primary: "#183a51",

  /** Light blue/cyan - links, secondary buttons, highlights */
  accent: "#5cb3e4",

  /** Pale blue - muted backgrounds, subtle elements */
  light: "#bfd7ea",

  /** Backgrounds */
  white: "#ffffff",

  /** Borders, inputs */
  gray: "#e5e5e5",
} as const;

export type MeterColor = keyof typeof METER_COLORS;
