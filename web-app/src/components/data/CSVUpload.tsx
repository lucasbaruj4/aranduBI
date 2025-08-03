'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { z } from 'zod';
import { 
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// CSV row validation schema
const csvRowSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  amount: z.coerce.number().finite('Amount must be a valid number'),
  description: z.string().optional(),
  category: z.string().optional(),
  customer: z.string().optional(),
  product: z.string().optional(),
});

export type CSVRow = z.infer<typeof csvRowSchema>;

export interface CSVUploadResult {
  data: CSVRow[];
  fileName: string;
  rowCount: number;
  errors: string[];
}

interface CSVUploadProps {
  onUploadComplete: (result: CSVUploadResult) => void;
  onUploadError: (error: string) => void;
  maxFileSize?: number; // in MB
}

export default function CSVUpload({ 
  onUploadComplete, 
  onUploadError,
  maxFileSize = 10
}: CSVUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateCSVData = useCallback((data: unknown[]): { validData: CSVRow[], errors: string[] } => {
    const validData: CSVRow[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
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
        validData.push(validatedRow);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors = error.issues.map(err => `Row ${index + 1}: ${err.path.join('.')} - ${err.message}`);
          errors.push(...fieldErrors);
        } else {
          errors.push(`Row ${index + 1}: Invalid data format`);
        }
      }
    });

    return { validData, errors };
  }, []);

  const processCSVFile = useCallback((file: File) => {
    setUploading(true);
    setUploadProgress(0);
    setValidationErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawContent = e.target?.result as string;
      
      // Now parse with Papa Parse
      Papa.parse(rawContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.toLowerCase().trim(),
        complete: (results) => {
          try {
            if (results.errors.length > 0) {
              const parseErrors = results.errors.map((err: any) => `Line ${err.row}: ${err.message}`);
              setValidationErrors(parseErrors);
              onUploadError(`CSV parsing errors: ${parseErrors.join(', ')}`);
              setUploading(false);
              return;
            }

            // Validate required columns
            if (results.data.length === 0) {
              onUploadError('CSV file is empty - please check file format and content');
              setUploading(false);
              return;
            }

            const firstRow = results.data[0] as Record<string, unknown>;
            const csvColumns = Object.keys(firstRow);
            const requiredColumns = ['date', 'amount'];
            const missingColumns = requiredColumns.filter(col => !csvColumns.includes(col));

            if (missingColumns.length > 0) {
              onUploadError(`Missing required columns: ${missingColumns.join(', ')}. Found columns: ${csvColumns.join(', ')}`);
              setUploading(false);
              return;
            }

            // Clean the data by trimming all string values
            const cleanedData = results.data.map((row: any) => {
              const cleanRow: Record<string, unknown> = {};
              Object.entries(row).forEach(([key, value]) => {
                cleanRow[key] = typeof value === 'string' ? value.trim() : value;
              });
              return cleanRow;
            });
            
            const { validData, errors } = validateCSVData(cleanedData);
            
            if (errors.length > 0) {
              setValidationErrors(errors);
              
              // If we have some valid data, still proceed but show warnings
              if (validData.length > 0) {
                setUploadProgress(100);
                onUploadComplete({
                  data: validData,
                  fileName: file.name,
                  rowCount: validData.length,
                  errors: errors
                });
              } else {
                onUploadError('No valid data rows found');
              }
            } else {
              setUploadProgress(100);
              onUploadComplete({
                data: validData,
                fileName: file.name,
                rowCount: validData.length,
                errors: []
              });
            }
          } catch (error) {
            onUploadError('Failed to process CSV file');
          } finally {
            setUploading(false);
          }
        },
        error: (error) => {
          onUploadError(`Failed to parse CSV: ${error.message}`);
          setUploading(false);
        }
      });
    };
    
    reader.onerror = () => {
      onUploadError('Failed to read file');
      setUploading(false);
    };
    
    reader.readAsText(file);
  }, [validateCSVData, onUploadComplete, onUploadError]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) {
      return;
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      onUploadError('Please select a CSV file');
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      onUploadError(`File size must be less than ${maxFileSize}MB`);
      return;
    }

    processCSVFile(file);
  }, [processCSVFile, onUploadError, maxFileSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false,
    disabled: uploading
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        
        {uploading ? (
          <div className="space-y-4">
            <p className="text-lg font-medium text-gray-900">Processing CSV...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">{Math.round(uploadProgress)}% complete</p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? 'Drop your CSV file here' : 'Upload your business data'}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop a CSV file, or click to select
            </p>
            <div className="text-xs text-gray-500">
              <p>Required columns: date, amount</p>
              <p>Optional columns: description, category, customer, product</p>
              <p>Maximum file size: {maxFileSize}MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                Data Validation Warnings ({validationErrors.length})
              </h3>
              <div className="max-h-32 overflow-y-auto">
                {validationErrors.slice(0, 5).map((error, index) => (
                  <p key={index} className="text-sm text-yellow-700 mb-1">
                    {error}
                  </p>
                ))}
                {validationErrors.length > 5 && (
                  <p className="text-sm text-yellow-600 font-medium">
                    ... and {validationErrors.length - 5} more errors
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={() => setValidationErrors([])}
              className="text-yellow-600 hover:text-yellow-800"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* CSV Format Example */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Expected CSV Format</h3>
        <div className="text-xs font-mono text-gray-600 bg-white p-2 rounded border">
          <div>date,amount,description,category,customer,product</div>
          <div>2024-01-15,250.00,Coffee sales,Sales,John Doe,Espresso</div>
          <div>2024-01-16,180.50,Lunch order,Food,Jane Smith,Sandwich</div>
        </div>
      </div>
    </div>
  );
}