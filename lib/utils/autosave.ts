/**
 * Autosave Utility
 * Handles draft recovery and session persistence for forms
 */

export interface AutosaveData {
  formData: Record<string, any>;
  timestamp: string;
  customerId?: string;
  formType: string;
}

const AUTOSAVE_PREFIX = "form_autosave_";
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

/**
 * Generate autosave key
 */
function getAutosaveKey(formType: string, customerId?: string): string {
  return `${AUTOSAVE_PREFIX}${formType}${customerId ? `_${customerId}` : ""}`;
}

/**
 * Save form data to localStorage
 */
export function saveFormDraft(
  formType: string,
  formData: Record<string, any>,
  customerId?: string
): void {
  if (typeof window === "undefined") return;

  try {
    const autosaveData: AutosaveData = {
      formData,
      timestamp: new Date().toISOString(),
      customerId,
      formType,
    };

    const key = getAutosaveKey(formType, customerId);
    localStorage.setItem(key, JSON.stringify(autosaveData));
  } catch (error) {
    console.warn("Failed to save form draft:", error);
  }
}

/**
 * Load form draft from localStorage
 */
export function loadFormDraft(
  formType: string,
  customerId?: string
): AutosaveData | null {
  if (typeof window === "undefined") return null;

  try {
    const key = getAutosaveKey(formType, customerId);
    const stored = localStorage.getItem(key);

    if (!stored) return null;

    const autosaveData: AutosaveData = JSON.parse(stored);

    // Check if draft is too old (older than 7 days)
    const draftDate = new Date(autosaveData.timestamp);
    const daysSinceDraft = (Date.now() - draftDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceDraft > 7) {
      // Draft is too old, remove it
      localStorage.removeItem(key);
      return null;
    }

    return autosaveData;
  } catch (error) {
    console.warn("Failed to load form draft:", error);
    return null;
  }
}

/**
 * Clear form draft
 */
export function clearFormDraft(formType: string, customerId?: string): void {
  if (typeof window === "undefined") return;

  try {
    const key = getAutosaveKey(formType, customerId);
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("Failed to clear form draft:", error);
  }
}

/**
 * Get all drafts for a form type
 */
export function getAllDrafts(formType: string): AutosaveData[] {
  if (typeof window === "undefined") return [];

  try {
    const drafts: AutosaveData[] = [];
    const prefix = getAutosaveKey(formType, "");

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const draft = JSON.parse(stored);
            drafts.push(draft);
          } catch {
            // Skip invalid entries
          }
        }
      }
    }

    return drafts.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.warn("Failed to get all drafts:", error);
    return [];
  }
}

/**
 * Enhanced autosave with multiple draft versions
 */
export interface EnhancedAutosaveData extends AutosaveData {
  id: string;
  name?: string;
  description?: string;
  version?: number;
}

const ENHANCED_AUTOSAVE_PREFIX = "form_autosave_enhanced_";
const MAX_DRAFT_VERSIONS = 10;

/**
 * Save multiple draft versions
 */
export function saveDraftVersion(
  formType: string,
  formData: Record<string, any>,
  customerId?: string,
  name?: string,
  description?: string
): EnhancedAutosaveData {
  if (typeof window === "undefined") {
    throw new Error("localStorage not available");
  }

  const id = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const drafts = getAllDraftVersions(formType, customerId);

  // Limit to max versions
  if (drafts.length >= MAX_DRAFT_VERSIONS) {
    // Remove oldest
    const oldest = drafts[drafts.length - 1];
    if (oldest) {
      deleteDraftVersion(formType, oldest.id, customerId);
    }
  }

  const draft: EnhancedAutosaveData = {
    id,
    formData,
    timestamp: new Date().toISOString(),
    customerId,
    formType,
    name: name || `Draft ${new Date().toLocaleString()}`,
    description,
    version: drafts.length + 1,
  };

  const key = `${ENHANCED_AUTOSAVE_PREFIX}${formType}${customerId ? `_${customerId}` : ""}_${id}`;
  localStorage.setItem(key, JSON.stringify(draft));

  return draft;
}

/**
 * Get all draft versions
 */
export function getAllDraftVersions(
  formType: string,
  customerId?: string
): EnhancedAutosaveData[] {
  if (typeof window === "undefined") return [];

  try {
    const drafts: EnhancedAutosaveData[] = [];
    const prefix = `${ENHANCED_AUTOSAVE_PREFIX}${formType}${customerId ? `_${customerId}` : ""}_`;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const draft = JSON.parse(stored) as EnhancedAutosaveData;
            drafts.push(draft);
          } catch {
            // Skip invalid entries
          }
        }
      }
    }

    return drafts.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.warn("Failed to get draft versions:", error);
    return [];
  }
}

/**
 * Delete a draft version
 */
export function deleteDraftVersion(
  formType: string,
  draftId: string,
  customerId?: string
): void {
  if (typeof window === "undefined") return;

  try {
    const key = `${ENHANCED_AUTOSAVE_PREFIX}${formType}${customerId ? `_${customerId}` : ""}_${draftId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("Failed to delete draft version:", error);
  }
}

/**
 * Update draft version name/description
 */
export function updateDraftVersion(
  formType: string,
  draftId: string,
  updates: Partial<Pick<EnhancedAutosaveData, "name" | "description">>,
  customerId?: string
): EnhancedAutosaveData | null {
  if (typeof window === "undefined") return null;

  try {
    const key = `${ENHANCED_AUTOSAVE_PREFIX}${formType}${customerId ? `_${customerId}` : ""}_${draftId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) return null;

    const draft = JSON.parse(stored) as EnhancedAutosaveData;
    const updated = {
      ...draft,
      ...updates,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.warn("Failed to update draft version:", error);
    return null;
  }
}

/**
 * Create autosave hook for React components
 */
export function createAutosaveHook(
  formType: string,
  customerId?: string,
  interval: number = AUTOSAVE_INTERVAL
) {
  let autosaveInterval: NodeJS.Timeout | null = null;

  return {
    start: (formData: Record<string, any>) => {
      // Clear existing interval
      if (autosaveInterval) {
        clearInterval(autosaveInterval);
      }

      // Save immediately
      saveFormDraft(formType, formData, customerId);

      // Set up interval
      autosaveInterval = setInterval(() => {
        saveFormDraft(formType, formData, customerId);
      }, interval);
    },

    stop: () => {
      if (autosaveInterval) {
        clearInterval(autosaveInterval);
        autosaveInterval = null;
      }
    },

    save: (formData: Record<string, any>) => {
      saveFormDraft(formType, formData, customerId);
    },

    load: () => {
      return loadFormDraft(formType, customerId);
    },

    clear: () => {
      clearFormDraft(formType, customerId);
    },
  };
}

