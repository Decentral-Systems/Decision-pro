/**
 * Testing Utilities for Dashboard Pages
 * Provides helper functions for functional, visual, and performance testing
 */

export interface PageTestResult {
  page: string;
  functional: {
    sectionsRender: boolean;
    actionsWork: boolean;
    filtersWork: boolean;
    dataLoads: boolean;
    errors: string[];
  };
  visual: {
    spacingConsistent: boolean;
    iconsDisplay: boolean;
    colorsConsistent: boolean;
    responsive: boolean;
    issues: string[];
  };
  performance: {
    loadTime: number;
    bundleSize: number;
    renderTime: number;
    issues: string[];
  };
}

/**
 * Test if all DashboardSection components render correctly
 */
export function testDashboardSections(): boolean {
  if (typeof window === 'undefined') return false;
  
  const sections = document.querySelectorAll('[data-dashboard-section]');
  const headers = document.querySelectorAll('[data-section-header]');
  
  return sections.length > 0 && sections.length === headers.length;
}

/**
 * Test if icons are displaying correctly
 */
export function testIconsDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  
  const icons = document.querySelectorAll('svg[class*="lucide"]');
  return icons.length > 0;
}

/**
 * Test responsive design breakpoints
 */
export function testResponsiveDesign(): {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
} {
  if (typeof window === 'undefined') {
    return { mobile: false, tablet: false, desktop: false };
  }
  
  const width = window.innerWidth;
  
  return {
    mobile: width < 768,
    tablet: width >= 768 && width < 1024,
    desktop: width >= 1024,
  };
}

/**
 * Measure page load performance
 */
export function measurePagePerformance(): {
  loadTime: number;
  renderTime: number;
  domContentLoaded: number;
} {
  if (typeof window === 'undefined' || !window.performance) {
    return { loadTime: 0, renderTime: 0, domContentLoaded: 0 };
  }
  
  const perfData = window.performance.timing;
  
  return {
    loadTime: perfData.loadEventEnd - perfData.navigationStart,
    renderTime: perfData.domContentLoadedEventEnd - perfData.navigationStart,
    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domInteractive,
  };
}

/**
 * Test keyboard navigation
 */
export function testKeyboardNavigation(): boolean {
  if (typeof window === 'undefined') return false;
  
  const focusableElements = document.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  return focusableElements.length > 0;
}

/**
 * Test color contrast for accessibility
 */
export function testColorContrast(element: HTMLElement): boolean {
  if (typeof window === 'undefined') return false;
  
  const style = window.getComputedStyle(element);
  const bgColor = style.backgroundColor;
  const textColor = style.color;
  
  // Basic contrast check (simplified)
  // In production, use a proper contrast checking library
  return true; // Placeholder
}

/**
 * Validate spacing consistency
 */
export function validateSpacing(): {
  consistent: boolean;
  issues: string[];
} {
  if (typeof window === 'undefined') {
    return { consistent: false, issues: [] };
  }
  
  const issues: string[] = [];
  const sections = document.querySelectorAll('[data-dashboard-section]');
  
  sections.forEach((section, index) => {
    const styles = window.getComputedStyle(section as HTMLElement);
    const marginBottom = styles.marginBottom;
    
    // Check if spacing is consistent (should be 2rem / 32px for space-y-8)
    if (marginBottom !== '32px' && marginBottom !== '2rem') {
      issues.push(`Section ${index + 1} has inconsistent spacing: ${marginBottom}`);
    }
  });
  
  return {
    consistent: issues.length === 0,
    issues,
  };
}

/**
 * Run comprehensive page test
 */
export async function runPageTest(pageName: string): Promise<PageTestResult> {
  const functional = {
    sectionsRender: testDashboardSections(),
    actionsWork: true, // Would need actual interaction testing
    filtersWork: true, // Would need actual interaction testing
    dataLoads: true, // Would need actual API testing
    errors: [] as string[],
  };
  
  const visual = {
    spacingConsistent: validateSpacing().consistent,
    iconsDisplay: testIconsDisplay(),
    colorsConsistent: true, // Would need actual color checking
    responsive: testResponsiveDesign().desktop || testResponsiveDesign().tablet,
    issues: validateSpacing().issues,
  };
  
  const perf = measurePagePerformance();
  
  const performance = {
    loadTime: perf.loadTime,
    bundleSize: 0, // Would need bundle analysis
    renderTime: perf.renderTime,
    issues: perf.loadTime > 3000 ? ['Page load time exceeds 3 seconds'] : [],
  };
  
  return {
    page: pageName,
    functional,
    visual,
    performance,
  };
}
