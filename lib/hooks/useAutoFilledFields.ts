/**
 * Hook to track auto-filled fields and their data sources
 */

import { useState, useEffect, useRef } from "react";
import { FieldDataSource, DataSource } from "@/components/common/FieldDataSourceBadge";

export interface AutoFilledFieldInfo {
  fieldName: string;
  dataSource: FieldDataSource;
  originalValue: any;
  isManuallyEdited: boolean;
}

export function useAutoFilledFields() {
  const [autoFilledFields, setAutoFilledFields] = useState<Map<string, AutoFilledFieldInfo>>(
    new Map()
  );
  const originalValuesRef = useRef<Map<string, any>>(new Map());

  /**
   * Mark a field as auto-filled
   */
  const markAsAutoFilled = (
    fieldName: string,
    value: any,
    source: DataSource = "crm",
    timestamp?: Date,
    confidence?: number
  ) => {
    const fieldInfo: AutoFilledFieldInfo = {
      fieldName,
      dataSource: {
        source,
        timestamp: timestamp || new Date(),
        confidence: confidence || 1.0,
        freshness: timestamp
          ? Date.now() - timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
            ? "fresh"
            : Date.now() - timestamp.getTime() < 30 * 24 * 60 * 60 * 1000
              ? "stale"
              : "outdated"
          : undefined,
      },
      originalValue: value,
      isManuallyEdited: false,
    };

    setAutoFilledFields((prev) => {
      const newMap = new Map(prev);
      newMap.set(fieldName, fieldInfo);
      return newMap;
    });

    originalValuesRef.current.set(fieldName, value);
  };

  /**
   * Mark a field as manually edited
   */
  const markAsManuallyEdited = (fieldName: string) => {
    setAutoFilledFields((prev) => {
      const fieldInfo = prev.get(fieldName);
      if (fieldInfo) {
        const newMap = new Map(prev);
        newMap.set(fieldName, {
          ...fieldInfo,
          isManuallyEdited: true,
        });
        return newMap;
      }
      return prev;
    });
  };

  /**
   * Check if a field is auto-filled
   */
  const isAutoFilled = (fieldName: string): boolean => {
    return autoFilledFields.has(fieldName);
  };

  /**
   * Get field info
   */
  const getFieldInfo = (fieldName: string): AutoFilledFieldInfo | undefined => {
    return autoFilledFields.get(fieldName);
  };

  /**
   * Get all data sources
   */
  const getAllDataSources = (): Record<string, FieldDataSource> => {
    const sources: Record<string, FieldDataSource> = {};
    autoFilledFields.forEach((info, fieldName) => {
      sources[fieldName] = info.dataSource;
    });
    return sources;
  };

  /**
   * Calculate overall confidence
   */
  const getOverallConfidence = (): number => {
    if (autoFilledFields.size === 0) return 1.0;

    const confidences = Array.from(autoFilledFields.values()).map(
      (info) => info.dataSource.confidence || 1.0
    );
    return confidences.reduce((a, b) => a + b, 0) / confidences.length;
  };

  /**
   * Get last updated timestamp
   */
  const getLastUpdated = (): Date | undefined => {
    const timestamps = Array.from(autoFilledFields.values())
      .map((info) => info.dataSource.timestamp)
      .filter((ts): ts is Date => ts !== undefined)
      .sort((a, b) => b.getTime() - a.getTime());

    return timestamps[0];
  };

  /**
   * Clear all auto-filled fields
   */
  const clear = () => {
    setAutoFilledFields(new Map());
    originalValuesRef.current.clear();
  };

  return {
    autoFilledFields: Array.from(autoFilledFields.values()),
    markAsAutoFilled,
    markAsManuallyEdited,
    isAutoFilled,
    getFieldInfo,
    getAllDataSources,
    getOverallConfidence,
    getLastUpdated,
    clear,
  };
}
