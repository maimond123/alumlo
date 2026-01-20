/**
 * Demo mode utilities
 * Centralized functions for managing demo functionality
 */

export interface DemoConfig {
  isDemoMode: boolean;
  organizationName: string;
  displayName: string;
}

/**
 * Check if the current session is in demo mode
 */
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('demoMode') === 'true';
}

/**
 * Get demo organization name for API calls
 */
export function getDemoOrganization(): string {
  if (typeof window === 'undefined') return 'demo';
  return sessionStorage.getItem('demoOrganization') || 'demo';
}

/**
 * Get demo display name for UI
 */
export function getDemoDisplayName(): string {
  if (typeof window === 'undefined') return '{Your Organization}';
  return sessionStorage.getItem('demoDisplayName') || '{Your Organization}';
}

/**
 * Get demo configuration
 */
export function getDemoConfig(): DemoConfig {
  if (typeof window === 'undefined') {
    return {
      isDemoMode: false,
      organizationName: '',
      displayName: ''
    };
  }

  const isDemo = sessionStorage.getItem('demoMode') === 'true';
  
  return {
    isDemoMode: isDemo,
    organizationName: isDemo ? getDemoOrganization() : '',
    displayName: isDemo ? getDemoDisplayName() : ''
  };
}

/**
 * Set demo mode (used by demo entry points)
 */
export function setDemoMode(organizationName: string = 'demo', displayName: string = '{Your Organization}') {
  if (typeof window === 'undefined') return;
  
  sessionStorage.setItem('demoMode', 'true');
  sessionStorage.setItem('demoOrganization', organizationName);
  sessionStorage.setItem('demoDisplayName', displayName);
  
  // Also set in localStorage for compatibility with existing search functionality
  localStorage.setItem('organizationName', organizationName);
}

/**
 * Clear demo mode
 */
export function clearDemoMode() {
  if (typeof window === 'undefined') return;
  
  sessionStorage.removeItem('demoMode');
  sessionStorage.removeItem('demoOrganization');
  sessionStorage.removeItem('demoDisplayName');
  
  // Also clear from localStorage
  localStorage.removeItem('organizationName');
}

/**
 * Initialize demo mode from URL parameters
 */
export function initDemoFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('demo') === 'true') {
    setDemoMode();
    return true;
  }
  return false;
} 