/**
 * Chart Utilities
 * 
 * Shared color palette and resolution logic for all chart components.
 * Maps descriptor color names to HSL-based palettes.
 */

const PALETTES: Record<string, string[]> = {
  teal: ["#2dd4bf", "#14b8a6", "#0d9488", "#0f766e", "#115e59"],
  blue: ["#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af"],
  purple: ["#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6"],
  pink: ["#f472b6", "#ec4899", "#db2777", "#be185d", "#9d174d"],
  orange: ["#fb923c", "#f97316", "#ea580c", "#c2410c", "#9a3412"],
  green: ["#4ade80", "#22c55e", "#16a34a", "#15803d", "#166534"],
  red: ["#f87171", "#ef4444", "#dc2626", "#b91c1c", "#991b1b"],
  yellow: ["#fbbf24", "#f59e0b", "#d97706", "#b45309", "#92400e"],
  cyan: ["#22d3ee", "#06b6d4", "#0891b2", "#0e7490", "#155e75"],
  indigo: ["#818cf8", "#6366f1", "#4f46e5", "#4338ca", "#3730a3"],
};

const DEFAULT_PALETTE = [
  "#60a5fa", "#a78bfa", "#f472b6", "#2dd4bf", "#fbbf24",
  "#4ade80", "#fb923c", "#22d3ee", "#818cf8", "#f87171",
];

/**
 * Resolves a color descriptor (name or hex) into a multi-shade palette.
 */
export function resolveChartColor(
  color: string | undefined,
  index: number
): string[] {
  if (!color) {
    // Rotate through default palette based on chart index
    const rotated = [...DEFAULT_PALETTE];
    for (let i = 0; i < index; i++) {
      rotated.push(rotated.shift()!);
    }
    return rotated;
  }

  const normalized = color.toLowerCase().replace(/[^a-z]/g, "");
  if (PALETTES[normalized]) {
    return PALETTES[normalized];
  }

  // If it's a hex/css color, create a single-color palette
  if (color.startsWith("#") || color.startsWith("rgb") || color.startsWith("hsl")) {
    return [color, color, color, color, color];
  }

  // Try to match partial name
  for (const [key, palette] of Object.entries(PALETTES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return palette;
    }
  }

  return DEFAULT_PALETTE;
}

/**
 * Returns a single primary color from a palette.
 */
export function resolvePrimaryColor(
  color: string | undefined,
  index: number
): string {
  const palette = resolveChartColor(color, index);
  return palette[0];
}
