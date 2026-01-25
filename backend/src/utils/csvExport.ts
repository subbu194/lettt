/**
 * CSV Export Utility
 * Converts JSON data to CSV format for admin exports
 */

export function jsonToCSV(data: Array<Record<string, unknown>>, columns?: string[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  // If columns not specified, use keys from first object
  const headers = columns || (data[0] ? Object.keys(data[0]) : []);
  
  // Create CSV header row
  const csvHeader = headers.map(h => escapeCSVValue(h)).join(',');
  
  // Create CSV data rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      return escapeCSVValue(value);
    }).join(',');
  });
  
  return [csvHeader, ...csvRows].join('\n');
}

function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  let stringValue = String(value);
  
  // Handle dates
  if (value instanceof Date) {
    stringValue = value.toISOString();
  }
  
  // Handle objects/arrays
  if (typeof value === 'object' && !(value instanceof Date)) {
    stringValue = JSON.stringify(value);
  }
  
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    stringValue = `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Flatten nested objects for CSV export
 */
export function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const flattened: Record<string, unknown> = {};
  
  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(flattened, flattenObject(value as Record<string, unknown>, newKey));
    } else {
      flattened[newKey] = value;
    }
  }
  
  return flattened;
}
