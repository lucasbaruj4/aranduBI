import { z } from 'zod';

// CSV parsing utilities for business data

export const csvRowSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  amount: z.coerce.number().finite('Amount must be a valid number'),
  description: z.string().optional(),
  category: z.string().optional(),
  customer: z.string().optional(),
  product: z.string().optional(),
});

export type CSVRow = z.infer<typeof csvRowSchema>;

export interface CSVParseResult {
  data: CSVRow[];
  errors: string[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    categories: string[];
    dateRange: {
      start: string;
      end: string;
    };
    totalAmount: number;
  };
}

export function validateCSVRow(row: unknown, rowIndex: number): { data?: CSVRow; error?: string } {
  try {
    // Clean and normalize row data
    const cleanRow: Record<string, unknown> = {};
    
    if (typeof row === 'object' && row !== null) {
      Object.entries(row).forEach(([key, value]) => {
        const normalizedKey = key.toLowerCase().trim();
        cleanRow[normalizedKey] = typeof value === 'string' ? value.trim() : value;
      });
    }

    // Validate the row
    const validatedRow = csvRowSchema.parse(cleanRow);
    return { data: validatedRow };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
      return { error: `Row ${rowIndex + 1} - ${fieldErrors.join(', ')}` };
    }
    return { error: `Row ${rowIndex + 1} - Invalid data format` };
  }
}

export function parseCSVData(rawData: unknown[]): CSVParseResult {
  const validData: CSVRow[] = [];
  const errors: string[] = [];

  rawData.forEach((row, index) => {
    const result = validateCSVRow(row, index);
    if (result.data) {
      validData.push(result.data);
    } else if (result.error) {
      errors.push(result.error);
    }
  });

  // Calculate summary statistics
  const categories = [...new Set(validData.map(row => row.category).filter(Boolean))] as string[];
  const dates = validData.map(row => new Date(row.date)).filter(date => !isNaN(date.getTime()));
  const amounts = validData.map(row => row.amount);

  const summary = {
    totalRows: rawData.length,
    validRows: validData.length,
    invalidRows: errors.length,
    categories,
    dateRange: {
      start: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))).toISOString() : '',
      end: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))).toISOString() : ''
    },
    totalAmount: amounts.reduce((sum, amount) => sum + amount, 0)
  };

  return {
    data: validData,
    errors,
    summary
  };
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(amount);
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

// Common CSV validation rules for business data
export const CSV_VALIDATION_RULES = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  requiredColumns: ['date', 'amount'],
  optionalColumns: ['description', 'category', 'customer', 'product'],
  supportedDateFormats: [
    'YYYY-MM-DD',
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'YYYY/MM/DD'
  ],
  maxRows: 10000, // Prevent memory issues
};

export function validateCSVStructure(headers: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  // Check for required columns
  const missingRequired = CSV_VALIDATION_RULES.requiredColumns.filter(
    col => !normalizedHeaders.includes(col)
  );
  
  if (missingRequired.length > 0) {
    errors.push(`Missing required columns: ${missingRequired.join(', ')}`);
  }
  
  // Check for duplicate columns
  const duplicates = normalizedHeaders.filter((header, index) => 
    normalizedHeaders.indexOf(header) !== index
  );
  
  if (duplicates.length > 0) {
    errors.push(`Duplicate columns found: ${[...new Set(duplicates)].join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}