"use client";

import { useState, useEffect, useCallback } from "react";

export type LoadingPriority = 1 | 2 | 3 | 4 | 5;

export interface ProgressiveLoadingTask {
  id: string;
  priority: LoadingPriority;
  load: () => Promise<any>;
  dependencies?: string[]; // IDs of tasks that must complete first
}

export interface ProgressiveLoadingOptions {
  /**
   * Delay between priority levels (ms)
   * @default 100
   */
  priorityDelay?: number;

  /**
   * Whether progressive loading is enabled
   * @default true
   */
  enabled?: boolean;
}

export interface ProgressiveLoadingReturn {
  /**
   * Whether critical data (Priority 1) is loaded
   */
  isCriticalLoaded: boolean;

  /**
   * Whether all data is loaded
   */
  isAllLoaded: boolean;

  /**
   * Loading progress (0-100)
   */
  progress: number;

  /**
   * Number of completed tasks
   */
  completedTasks: number;

  /**
   * Total number of tasks
   */
  totalTasks: number;

  /**
   * Loading states by task ID
   */
  taskStates: Record<string, { isLoading: boolean; isComplete: boolean; error?: Error }>;

  /**
   * Manually trigger a task to load
   */
  loadTask: (taskId: string) => Promise<void>;

  /**
   * Reload all tasks
   */
  reload: () => Promise<void>;
}

/**
 * Hook for progressive data loading with priorities
 * 
 * Features:
 * - Priority-based loading (1 = critical, 5 = lowest priority)
 * - Dependency management
 * - Progress tracking
 * - Error handling per task
 * 
 * @example
 * ```tsx
 * const { isCriticalLoaded, progress, loadTask } = useProgressiveLoading({
 *   tasks: [
 *     { id: 'kpis', priority: 1, load: () => fetchKPIs() },
 *     { id: 'charts', priority: 4, load: () => fetchCharts(), dependencies: ['kpis'] },
 *   ],
 * });
 * ```
 */
export function useProgressiveLoading(
  tasks: ProgressiveLoadingTask[],
  options: ProgressiveLoadingOptions = {}
): ProgressiveLoadingReturn {
  const { priorityDelay = 100, enabled = true } = options;

  const [taskStates, setTaskStates] = useState<Record<string, { isLoading: boolean; isComplete: boolean; error?: Error }>>(
    tasks.reduce((acc, task) => {
      acc[task.id] = { isLoading: false, isComplete: false };
      return acc;
    }, {} as Record<string, { isLoading: boolean; isComplete: boolean; error?: Error }>)
  );

  const [isCriticalLoaded, setIsCriticalLoaded] = useState(false);
  const [isAllLoaded, setIsAllLoaded] = useState(false);

  // Calculate progress
  const completedTasks = Object.values(taskStates).filter((state) => state.isComplete).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Check if critical tasks are loaded (priority 1)
  useEffect(() => {
    const criticalTasks = tasks.filter((t) => t.priority === 1);
    const allCriticalLoaded = criticalTasks.every((task) => taskStates[task.id]?.isComplete);
    setIsCriticalLoaded(allCriticalLoaded && criticalTasks.length > 0);
  }, [taskStates, tasks]);

  // Check if all tasks are loaded
  useEffect(() => {
    const allLoaded = tasks.every((task) => taskStates[task.id]?.isComplete);
    setIsAllLoaded(allLoaded);
  }, [taskStates, tasks]);

  // Load a single task
  const loadTask = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        console.warn(`[useProgressiveLoading] Task not found: ${taskId}`);
        return;
      }

      // Check dependencies
      if (task.dependencies) {
        const unmetDependencies = task.dependencies.filter(
          (depId) => !taskStates[depId]?.isComplete
        );
        if (unmetDependencies.length > 0) {
          console.log(`[useProgressiveLoading] Task ${taskId} waiting for dependencies:`, unmetDependencies);
          // Wait for dependencies
          await Promise.all(
            unmetDependencies.map((depId) => {
              return new Promise<void>((resolve) => {
                const checkInterval = setInterval(() => {
                  if (taskStates[depId]?.isComplete) {
                    clearInterval(checkInterval);
                    resolve();
                  }
                }, 100);
              });
            })
          );
        }
      }

      // Mark as loading
      setTaskStates((prev) => ({
        ...prev,
        [taskId]: { isLoading: true, isComplete: false },
      }));

      try {
        await task.load();
        // Mark as complete
        setTaskStates((prev) => ({
          ...prev,
          [taskId]: { isLoading: false, isComplete: true },
        }));
      } catch (error) {
        // Mark as error
        setTaskStates((prev) => ({
          ...prev,
          [taskId]: {
            isLoading: false,
            isComplete: false,
            error: error as Error,
          },
        }));
        console.error(`[useProgressiveLoading] Error loading task ${taskId}:`, error);
      }
    },
    [tasks, taskStates]
  );

  // Load tasks progressively by priority
  const loadTasksProgressively = useCallback(async () => {
    if (!enabled) return;

    // Sort tasks by priority
    const sortedTasks = [...tasks].sort((a, b) => a.priority - b.priority);

    // Group by priority
    const tasksByPriority: Record<number, ProgressiveLoadingTask[]> = {};
    sortedTasks.forEach((task) => {
      if (!tasksByPriority[task.priority]) {
        tasksByPriority[task.priority] = [];
      }
      tasksByPriority[task.priority].push(task);
    });

    // Load each priority level
    for (const priority of [1, 2, 3, 4, 5] as LoadingPriority[]) {
      const tasksAtPriority = tasksByPriority[priority];
      if (!tasksAtPriority || tasksAtPriority.length === 0) continue;

      // Load all tasks at this priority level in parallel
      await Promise.all(
        tasksAtPriority.map((task) => loadTask(task.id))
      );

      // Delay before next priority level (except for last priority)
      if (priority < 5 && tasksByPriority[(priority + 1) as LoadingPriority]?.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, priorityDelay));
      }
    }
  }, [enabled, tasks, loadTask, priorityDelay]);

  // Initial load
  useEffect(() => {
    loadTasksProgressively();
  }, []); // Only run once on mount

  // Reload all tasks
  const reload = useCallback(async () => {
    // Reset all task states
    setTaskStates(
      tasks.reduce((acc, task) => {
        acc[task.id] = { isLoading: false, isComplete: false };
        return acc;
      }, {} as Record<string, { isLoading: boolean; isComplete: boolean; error?: Error }>)
    );
    // Reload
    await loadTasksProgressively();
  }, [tasks, loadTasksProgressively]);

  return {
    isCriticalLoaded,
    isAllLoaded,
    progress,
    completedTasks,
    totalTasks,
    taskStates,
    loadTask,
    reload,
  };
}



