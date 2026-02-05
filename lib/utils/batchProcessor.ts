/**
 * Batch Processor Utility
 * Handles chunked processing of large datasets with progress tracking
 */

import { withRetryResult } from "./retry";

export interface BatchProcessorOptions<TInput, TOutput> {
  /** Number of items to process in each chunk (default: 10) */
  chunkSize?: number;
  /** Delay between chunks in ms (default: 100) */
  delayBetweenChunks?: number;
  /** Maximum number of retries per item (default: 2) */
  maxRetries?: number;
  /** Process function for each item */
  processor: (item: TInput, index: number) => Promise<TOutput>;
  /** Callback when an item completes */
  onItemComplete?: (result: BatchItemResult<TInput, TOutput>, progress: BatchProgress) => void;
  /** Callback when a chunk completes */
  onChunkComplete?: (chunkIndex: number, progress: BatchProgress) => void;
  /** Abort signal to cancel processing */
  abortSignal?: AbortSignal;
}

export interface BatchItemResult<TInput, TOutput> {
  input: TInput;
  index: number;
  success: boolean;
  output?: TOutput;
  error?: unknown;
  attempts: number;
}

export interface BatchProgress {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  percentage: number;
  estimatedTimeRemaining: number | null;
  currentChunk: number;
  totalChunks: number;
}

export interface BatchResult<TInput, TOutput> {
  results: BatchItemResult<TInput, TOutput>[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    duration: number;
    aborted: boolean;
  };
}

/**
 * Process items in batches with progress tracking
 */
export async function processBatch<TInput, TOutput>(
  items: TInput[],
  options: BatchProcessorOptions<TInput, TOutput>
): Promise<BatchResult<TInput, TOutput>> {
  const {
    chunkSize = 10,
    delayBetweenChunks = 100,
    maxRetries = 2,
    processor,
    onItemComplete,
    onChunkComplete,
    abortSignal,
  } = options;

  const startTime = Date.now();
  const results: BatchItemResult<TInput, TOutput>[] = [];
  const chunks = chunkArray(items, chunkSize);
  
  let completed = 0;
  let successful = 0;
  let failed = 0;
  let aborted = false;

  const getProgress = (): BatchProgress => {
    const percentage = items.length > 0 ? (completed / items.length) * 100 : 0;
    const elapsed = Date.now() - startTime;
    const avgTimePerItem = completed > 0 ? elapsed / completed : 0;
    const remaining = items.length - completed;
    const estimatedTimeRemaining = avgTimePerItem > 0 ? avgTimePerItem * remaining : null;

    return {
      total: items.length,
      completed,
      successful,
      failed,
      percentage,
      estimatedTimeRemaining,
      currentChunk: Math.floor(completed / chunkSize),
      totalChunks: chunks.length,
    };
  };

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    // Check for abort
    if (abortSignal?.aborted) {
      aborted = true;
      break;
    }

    const chunk = chunks[chunkIndex];
    
    // Process items in chunk concurrently
    const chunkPromises = chunk.map(async (item, itemIndex) => {
      const globalIndex = chunkIndex * chunkSize + itemIndex;
      
      const retryResult = await withRetryResult(
        () => processor(item, globalIndex),
        { maxAttempts: maxRetries + 1 }
      );

      const itemResult: BatchItemResult<TInput, TOutput> = {
        input: item,
        index: globalIndex,
        success: retryResult.success,
        output: retryResult.data,
        error: retryResult.error,
        attempts: retryResult.attempts,
      };

      // Update counters
      completed++;
      if (retryResult.success) {
        successful++;
      } else {
        failed++;
      }

      // Callback
      onItemComplete?.(itemResult, getProgress());

      return itemResult;
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);

    // Chunk complete callback
    onChunkComplete?.(chunkIndex, getProgress());

    // Delay between chunks (except for last chunk)
    if (chunkIndex < chunks.length - 1 && delayBetweenChunks > 0) {
      await sleep(delayBetweenChunks);
    }
  }

  return {
    results,
    summary: {
      total: items.length,
      successful,
      failed,
      duration: Date.now() - startTime,
      aborted,
    },
  };
}

/**
 * Parse CSV content to array of objects
 */
export function parseCSV(content: string, hasHeader: boolean = true): Record<string, string>[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  const headers = hasHeader 
    ? lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    : lines[0].split(',').map((_, i) => `column_${i}`);

  const dataLines = hasHeader ? lines.slice(1) : lines;
  
  return dataLines.map(line => {
    const values = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Validate batch input data
 */
export function validateBatchInput(
  data: Record<string, string>[],
  requiredFields: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.length === 0) {
    errors.push('No data provided');
    return { valid: false, errors };
  }

  // Check required fields
  const firstRow = data[0];
  const missingFields = requiredFields.filter(field => !(field in firstRow));
  if (missingFields.length > 0) {
    errors.push(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate each row
  data.forEach((row, index) => {
    requiredFields.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        errors.push(`Row ${index + 1}: Missing value for ${field}`);
      }
    });
  });

  return { 
    valid: errors.length === 0, 
    errors: errors.slice(0, 10) // Limit to first 10 errors
  };
}

// Utility functions
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { chunkArray, sleep };






