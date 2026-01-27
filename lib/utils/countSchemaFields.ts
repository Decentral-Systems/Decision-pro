/**
 * Utility to count all fields in a Zod schema recursively
 * Handles nested objects, arrays, and optional fields
 */
import { z } from "zod";

interface SchemaFieldCount {
  totalFields: number;
  requiredFields: number;
  optionalFields: number;
  nestedFields: number;
}

/**
 * Recursively count fields in a Zod schema
 */
export function countSchemaFields(schema: z.ZodObject<any>): SchemaFieldCount {
  let totalFields = 0;
  let requiredFields = 0;
  let optionalFields = 0;
  let nestedFields = 0;

  const shape = schema.shape;

  for (const [key, fieldSchema] of Object.entries(shape)) {
    totalFields++;

    // Check if field is optional
    const isOptional = fieldSchema instanceof z.ZodOptional || 
                       fieldSchema instanceof z.ZodDefault ||
                       (fieldSchema as any)._def?.typeName === "ZodOptional" ||
                       (fieldSchema as any)._def?.typeName === "ZodDefault";

    if (isOptional) {
      optionalFields++;
    } else {
      requiredFields++;
    }

    // Handle nested objects
    if (fieldSchema instanceof z.ZodObject) {
      const nestedCount = countSchemaFields(fieldSchema);
      nestedFields += nestedCount.totalFields;
      totalFields += nestedCount.totalFields - 1; // Subtract 1 to avoid double counting
      requiredFields += nestedCount.requiredFields;
      optionalFields += nestedCount.optionalFields;
    }

    // Handle arrays of objects (like cards)
    if (fieldSchema instanceof z.ZodArray) {
      const innerType = (fieldSchema as z.ZodArray<any>)._def.type;
      if (innerType instanceof z.ZodObject) {
        const nestedCount = countSchemaFields(innerType);
        // For arrays, we count the nested fields but don't multiply by array length
        // since we're counting potential fields, not actual instances
        nestedFields += nestedCount.totalFields;
        totalFields += nestedCount.totalFields;
        requiredFields += nestedCount.requiredFields;
        optionalFields += nestedCount.optionalFields;
      }
    }

    // Handle optional wrappers that contain objects
    if (fieldSchema instanceof z.ZodOptional) {
      const unwrapped = (fieldSchema as z.ZodOptional<any>)._def.innerType;
      if (unwrapped instanceof z.ZodObject) {
        const nestedCount = countSchemaFields(unwrapped);
        nestedFields += nestedCount.totalFields;
        totalFields += nestedCount.totalFields;
        requiredFields += nestedCount.requiredFields;
        optionalFields += nestedCount.optionalFields;
      }
    }
  }

  return {
    totalFields,
    requiredFields,
    optionalFields,
    nestedFields,
  };
}

/**
 * Count fields in form data, including nested fields in cards array
 */
export function countFilledFields(formData: Record<string, any>): {
  filledCount: number;
  totalCounted: number;
} {
  let filledCount = 0;
  let totalCounted = 0;

  const hasValue = (value: any): boolean => {
    if (value === undefined || value === null || value === "") return false;
    if (typeof value === "number" && value === 0) return true; // 0 is a valid value
    if (Array.isArray(value)) {
      if (value.length === 0) return false;
      // For arrays, count filled items
      return value.some((item) => {
        if (typeof item === "object" && item !== null) {
          return Object.values(item).some((v) => hasValue(v));
        }
        return hasValue(item);
      });
    }
    if (typeof value === "object" && value !== null) {
      // For objects, check if any nested field has value
      return Object.values(value).some((v) => hasValue(v));
    }
    if (typeof value === "boolean") return true; // booleans are always valid
    return true;
  };

  for (const [key, value] of Object.entries(formData)) {
    totalCounted++;

    if (key === "cards" && Array.isArray(value)) {
      // Count fields in each card
      for (const card of value) {
        if (card && typeof card === "object") {
          // Count employer fields
          if (card.employer && typeof card.employer === "object") {
            for (const fieldValue of Object.values(card.employer)) {
              totalCounted++;
              if (hasValue(fieldValue)) {
                filledCount++;
              }
            }
          }
          // Count bank fields
          if (card.bank && typeof card.bank === "object") {
            for (const fieldValue of Object.values(card.bank)) {
              totalCounted++;
              if (hasValue(fieldValue)) {
                filledCount++;
              }
            }
          }
          // Count card-level fields
          if (hasValue(card.card_name)) filledCount++;
          if (hasValue(card.is_primary)) filledCount++;
          totalCounted += 2;
        }
      }
    } else if (hasValue(value)) {
      filledCount++;
    }
  }

  return { filledCount, totalCounted };
}

