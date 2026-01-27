"use client";

import { useRouter } from "next/navigation";

/**
 * Reliable navigation utility that ensures navigation always works
 * with fallback to window.location.href if router.push() fails
 */
export function useReliableNavigation() {
  const router = useRouter();

  const navigate = (path: string, options?: { replace?: boolean }) => {
    const currentPath = window.location.pathname;
    
    // If already on target path, don't navigate
    if (currentPath === path) {
      return;
    }

    try {
      // Try router navigation first
      if (options?.replace) {
        router.replace(path);
      } else {
        router.push(path);
      }

      // Check if navigation occurred after a delay
      setTimeout(() => {
        if (window.location.pathname === currentPath && currentPath !== path) {
          console.warn(`[Navigation] Router navigation failed for ${path}, using window.location`);
          if (options?.replace) {
            window.location.replace(path);
          } else {
            window.location.href = path;
          }
        }
      }, 200);
    } catch (error) {
      console.error(`[Navigation] Navigation error for ${path}:`, error);
      // Fallback to window.location
      if (options?.replace) {
        window.location.replace(path);
      } else {
        window.location.href = path;
      }
    }
  };

  return { navigate };
}

/**
 * Standalone navigation function (for use outside components)
 * Uses window.location.href directly for maximum reliability
 */
export function navigateTo(path: string, options?: { replace?: boolean }) {
  if (typeof window === "undefined") {
    return;
  }

  const currentPath = window.location.pathname;
  const targetPath = path.split('?')[0]; // Get path without query params for comparison
  
  // If already on target path, don't navigate
  if (currentPath === targetPath) {
    return;
  }

  // Use window.location for maximum reliability
  // This ensures navigation always works regardless of router state
  try {
    if (options?.replace) {
      window.location.replace(path);
    } else {
      window.location.href = path;
    }
  } catch (error) {
    console.error(`[Navigation] Navigation error for ${path}:`, error);
    // Final fallback
    if (options?.replace) {
      window.location.replace(path);
    } else {
      window.location.href = path;
    }
  }
}
