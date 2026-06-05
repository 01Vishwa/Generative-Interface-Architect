/**
 * Data Pre-processing Utilities
 * 
 * Cleans and coerces raw string data from CSVs into proper JavaScript
 * types (numbers, booleans) for better rendering in charts and tables.
 */

export function coerceDataTypes(data: Record<string, string>[]): Record<string, string | number | boolean | null>[] {
  return data.map(row => {
    const coercedRow: Record<string, string | number | boolean | null> = {};
    
    for (const [key, value] of Object.entries(row)) {
      if (value === null || value === undefined || value.trim() === "") {
        coercedRow[key] = null;
        continue;
      }
      
      const trimmed = value.trim();
      
      // Try to parse as a number (handling commas in numbers like "1,000")
      const numStr = trimmed.replace(/,/g, '');
      if (!isNaN(Number(numStr)) && numStr !== "") {
        coercedRow[key] = Number(numStr);
        continue;
      }
      
      // Try boolean
      const lower = trimmed.toLowerCase();
      if (lower === "true" || lower === "yes") {
        coercedRow[key] = true;
        continue;
      }
      if (lower === "false" || lower === "no") {
        coercedRow[key] = false;
        continue;
      }
      
      // Default to string
      coercedRow[key] = trimmed;
    }
    
    return coercedRow;
  });
}
