/**
 * Undo/Redo Manager
 * Manages action history for undo/redo functionality
 */

export interface Action {
  id: string;
  type: "create" | "update" | "delete" | "toggle" | "bulk";
  timestamp: number;
  data: any;
  undo: () => Promise<void> | void;
  redo: () => Promise<void> | void;
}

export class UndoRedoManager {
  private history: Action[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  /**
   * Add an action to history
   */
  addAction(action: Omit<Action, "id" | "timestamp">): void {
    // Remove any actions after current index (when undoing and then doing a new action)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    const newAction: Action = {
      ...action,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };

    this.history.push(newAction);
    this.currentIndex = this.history.length - 1;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  /**
   * Undo last action
   */
  async undo(): Promise<boolean> {
    if (!this.canUndo()) {
      return false;
    }

    const action = this.history[this.currentIndex];
    await action.undo();
    this.currentIndex--;
    return true;
  }

  /**
   * Redo last undone action
   */
  async redo(): Promise<boolean> {
    if (!this.canRedo()) {
      return false;
    }

    this.currentIndex++;
    const action = this.history[this.currentIndex];
    await action.redo();
    return true;
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get current history state
   */
  getHistory(): Action[] {
    return [...this.history];
  }

  /**
   * Get current index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }
}

