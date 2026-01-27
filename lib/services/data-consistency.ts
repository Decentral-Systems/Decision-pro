/**
 * Data Consistency Management Service
 * Handles data conflicts and ensures transactional consistency
 */

export interface DataConflict {
  field: string;
  localValue: any;
  serverValue: any;
  source: "local" | "server";
  timestamp: Date;
}

export interface ConflictResolution {
  field: string;
  resolvedValue: any;
  resolution: "local" | "server" | "manual";
  resolvedBy?: string;
  resolvedAt: Date;
}

export class DataConsistencyService {
  private conflicts: Map<string, DataConflict[]> = new Map();
  private resolutions: Map<string, ConflictResolution[]> = new Map();

  /**
   * Detect conflicts between local and server data
   */
  detectConflicts(
    entityId: string,
    localData: Record<string, any>,
    serverData: Record<string, any>
  ): DataConflict[] {
    const conflicts: DataConflict[] = [];

    // Compare all fields
    const allFields = new Set([...Object.keys(localData), ...Object.keys(serverData)]);

    allFields.forEach((field) => {
      const localValue = localData[field];
      const serverValue = serverData[field];

      // Skip if values are equal
      if (JSON.stringify(localValue) === JSON.stringify(serverValue)) {
        return;
      }

      // Determine which is newer
      const localTimestamp = this.getFieldTimestamp(entityId, field, "local");
      const serverTimestamp = this.getFieldTimestamp(entityId, field, "server");

      conflicts.push({
        field,
        localValue,
        serverValue,
        source: localTimestamp > serverTimestamp ? "local" : "server",
        timestamp: new Date(),
      });
    });

    if (conflicts.length > 0) {
      this.conflicts.set(entityId, conflicts);
    }

    return conflicts;
  }

  /**
   * Resolve conflict
   */
  resolveConflict(
    entityId: string,
    field: string,
    resolution: "local" | "server" | "manual",
    resolvedValue?: any,
    resolvedBy?: string
  ): ConflictResolution {
    const conflict = this.conflicts
      .get(entityId)
      ?.find((c) => c.field === field);

    if (!conflict) {
      throw new Error(`No conflict found for ${entityId}.${field}`);
    }

    const resolvedValueToUse =
      resolvedValue ||
      (resolution === "local" ? conflict.localValue : conflict.serverValue);

    const resolutionRecord: ConflictResolution = {
      field,
      resolvedValue: resolvedValueToUse,
      resolution,
      resolvedBy,
      resolvedAt: new Date(),
    };

    // Store resolution
    if (!this.resolutions.has(entityId)) {
      this.resolutions.set(entityId, []);
    }
    this.resolutions.get(entityId)!.push(resolutionRecord);

    // Remove from conflicts
    const conflicts = this.conflicts.get(entityId) || [];
    this.conflicts.set(
      entityId,
      conflicts.filter((c) => c.field !== field)
    );

    return resolutionRecord;
  }

  /**
   * Get conflicts for entity
   */
  getConflicts(entityId: string): DataConflict[] {
    return this.conflicts.get(entityId) || [];
  }

  /**
   * Get resolutions for entity
   */
  getResolutions(entityId: string): ConflictResolution[] {
    return this.resolutions.get(entityId) || [];
  }

  /**
   * Clear conflicts for entity
   */
  clearConflicts(entityId: string): void {
    this.conflicts.delete(entityId);
  }

  /**
   * Get field timestamp (from localStorage or server)
   */
  private getFieldTimestamp(
    entityId: string,
    field: string,
    source: "local" | "server"
  ): number {
    if (typeof window === "undefined") return 0;
    try {
      const key = `field_timestamp_${entityId}_${field}_${source}`;
      const stored = localStorage.getItem(key);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Set field timestamp
   */
  setFieldTimestamp(
    entityId: string,
    field: string,
    source: "local" | "server"
  ): void {
    if (typeof window === "undefined") return;
    try {
      const key = `field_timestamp_${entityId}_${field}_${source}`;
      localStorage.setItem(key, Date.now().toString());
    } catch (error) {
      console.warn("Failed to set field timestamp:", error);
    }
  }

  /**
   * Synchronize data across browser tabs
   */
  syncAcrossTabs(entityId: string, data: Record<string, any>): void {
    // Use BroadcastChannel for cross-tab communication
    if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(`data_sync_${entityId}`);
      channel.postMessage({
        type: "data_update",
        entityId,
        data,
        timestamp: Date.now(),
      });
    }
  }
}

// Singleton instance
export const dataConsistencyService = new DataConsistencyService();
