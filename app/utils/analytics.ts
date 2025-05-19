import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel with your project token
const MIXPANEL_TOKEN = '734da60febbf101dd204ef6d430dbfeb';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Only initialize if in browser
if (isBrowser) {
  // Initialize with more flexible configuration for cross-platform support
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV !== 'production',
    track_pageview: true,
    persistence: 'localStorage', // Use localStorage for better cross-browser compatibility
    api_host: 'https://api.mixpanel.com',
    cookie_name: 'alumIntel_mp',
    secure_cookie: true,
    ip: false,
    cross_subdomain_cookie: false, // Helps with cookie issues on some browsers
    property_blacklist: ['$current_url', '$initial_referrer', '$referrer'],
    loaded: () => {
      // Configure session recording for all browsers
      mixpanel.set_config({ 
        'record_sessions_percent': 100,
        'persistence': 'localStorage',
        'cross_site_cookie': false,
        'secure_cookie': true
      });
      
      try {
        // Delay autotracking to ensure DOM is fully loaded
        setTimeout(() => {
          if ('autotrack' in mixpanel) {
            // Enable autotrack with more cross-platform safe options
            (mixpanel as any).autotrack({
              persist: true,
              cross_subdomain_cookie: false,
              cookie_name: 'alumIntel_mp_at',
              secure_cookie: true,
              track_links: true,
              track_forms: true
            });
          }
        }, 1000);
      } catch (e) {
        console.error('Mixpanel autotrack setup error:', e);
      }
    }
  });
}

// Session ID to link events together
let sessionId = isBrowser ? generateSessionId() : '';

// Visitor ID to identify unique users (persists across sessions)
let visitorId = isBrowser ? getOrCreateVisitorId() : '';

// Flag to determine if session recording is active
let isSessionRecordingActive = false;

// Generate a unique session ID
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

// Get existing visitor ID from localStorage or create a new one
function getOrCreateVisitorId() {
  if (!isBrowser) return '';
  
  try {
    const storedVisitorId = localStorage.getItem('alumIntel_visitor_id');
    if (storedVisitorId) {
      return storedVisitorId;
    }
    
    const newVisitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('alumIntel_visitor_id', newVisitorId);
    return newVisitorId;
  } catch (e) {
    // Fallback if localStorage fails (private browsing mode)
    return 'visitor_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }
}

// Initialize session recording and advanced tracking
export const initSessionRecording = () => {
  if (!isBrowser) return;
  
  try {
    // Reset session ID for new sessions
    sessionId = generateSessionId();
    
    // Ensure visitor ID is set
    visitorId = getOrCreateVisitorId();
    
    // Identify this visitor with their unique ID
    mixpanel.identify(visitorId);
    
    // Always include critical visitor information with user profile
    mixpanel.people.set({
      '$name': `Visitor ${visitorId.substring(8, 16)}`,
      'visitor_id': visitorId,
      'first_seen': new Date().toISOString(),
      'browser': navigator.userAgent,
      'platform': navigator.platform,
      'os': detectOperatingSystem()
    });
    
    // Enable session recording explicitly - this is critical for replay functionality
    if (!isSessionRecordingActive) {
      try {
        // Use setTimeout to ensure Mixpanel is fully loaded before starting recording
        setTimeout(() => {
          if ((mixpanel as any).session_recording) {
            (mixpanel as any).session_recording.start();
            isSessionRecordingActive = true;
            console.log('Session recording started successfully');
          } else {
            // Fallback for browsers where session_recording isn't available
            console.log('Session recording API not available, using enhanced event tracking instead');
            enableEnhancedTracking();
          }
        }, 1000);
      } catch (e) {
        console.error('Session recording start error:', e);
        // Fallback to enhanced event tracking
        enableEnhancedTracking();
      }
    }
    
    // Track session start
    mixpanel.track('Session Start', {
      session_id: sessionId,
      visitor_id: visitorId,
      referrer: document.referrer,
      landing_page: window.location.href,
      user_agent: navigator.userAgent,
      platform: navigator.platform,
      os: detectOperatingSystem(),
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
      device_pixel_ratio: window.devicePixelRatio || 1
    });
    
    // Set up global event listeners for comprehensive tracking
    setupGlobalEventListeners();
    
    console.log('Mixpanel session recording initialized with ID:', sessionId);
    console.log('Visitor ID:', visitorId);
    console.log('Operating System:', detectOperatingSystem());
  } catch (error) {
    console.error('Failed to initialize session recording:', error);
  }
};

// Helper function to detect operating system more accurately
function detectOperatingSystem() {
  const userAgent = window.navigator.userAgent;
  let os = "Unknown";
  
  if (userAgent.indexOf("Win") !== -1) os = "Windows";
  else if (userAgent.indexOf("Mac") !== -1) os = "MacOS";
  else if (userAgent.indexOf("Linux") !== -1) os = "Linux";
  else if (userAgent.indexOf("Android") !== -1) os = "Android";
  else if (userAgent.indexOf("like Mac") !== -1) os = "iOS";
  
  return os;
}

// Enhanced tracking as a fallback when session recording isn't available
function enableEnhancedTracking() {
  if (!isBrowser) return;
  
  // Track DOM mutations for replay-like functionality
  if ('MutationObserver' in window) {
    const observer = new MutationObserver((mutations) => {
      // Only track significant mutations to avoid overwhelming Mixpanel
      const significantMutations = mutations.filter(m => 
        m.type === 'childList' && m.addedNodes.length > 0 ||
        m.type === 'attributes' && ['class', 'style', 'id'].includes(m.attributeName || '')
      );
      
      if (significantMutations.length > 0) {
        mixpanel.track('DOM Mutation', {
          session_id: sessionId,
          visitor_id: visitorId,
          mutations_count: significantMutations.length,
          timestamp: new Date().toISOString(),
          url: window.location.href
        });
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      attributes: true,
      subtree: true,
      attributeFilter: ['class', 'style', 'id']
    });
  }
}

// Setup global event listeners for session recording
function setupGlobalEventListeners() {
  if (!isBrowser) return;
  
  // Track all clicks
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    const classes = target.className;
    const id = target.id;
    const text = target.textContent?.trim().substring(0, 50);
    
    mixpanel.track('Element Click', {
      session_id: sessionId,
      visitor_id: visitorId,
      element_type: tagName,
      element_id: id || undefined,
      element_class: classes || undefined,
      element_text: text || undefined,
      x_position: e.clientX,
      y_position: e.clientY,
      url: window.location.href
    });
  });
  
  // Track form interactions
  document.addEventListener('change', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'input' || 
        target.tagName.toLowerCase() === 'select' || 
        target.tagName.toLowerCase() === 'textarea') {
      
      const inputElement = target as HTMLInputElement;
      const fieldType = inputElement.type || 'text';
      const fieldName = inputElement.name || inputElement.id;
      
      // Don't track values for sensitive fields
      const isSensitiveField = fieldType === 'password' || 
                               fieldName.includes('password') || 
                               fieldName.includes('credit') || 
                               fieldName.includes('card');
      
      mixpanel.track('Form Field Interaction', {
        session_id: sessionId,
        visitor_id: visitorId,
        field_type: fieldType,
        field_name: fieldName,
        has_value: !!inputElement.value,
        // Mark sensitive fields for proper handling in replay
        is_sensitive: isSensitiveField,
        url: window.location.href
      });
    }
  });
  
  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    mixpanel.track('Visibility Change', {
      session_id: sessionId,
      visitor_id: visitorId,
      is_visible: !document.hidden,
      url: window.location.href
    });
  });
  
  // Track user leaving/returning to window
  window.addEventListener('blur', () => {
    mixpanel.track('Window Blur', {
      session_id: sessionId,
      visitor_id: visitorId,
      time: new Date().toISOString(),
      url: window.location.href
    });
  });
  
  window.addEventListener('focus', () => {
    mixpanel.track('Window Focus', {
      session_id: sessionId,
      visitor_id: visitorId,
      time: new Date().toISOString(),
      url: window.location.href
    });
  });
  
  // Track mouse movement (throttled)
  let lastMoveTime = 0;
  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    // Only track movements every 2 seconds to avoid overwhelming Mixpanel
    if (now - lastMoveTime > 2000) {
      lastMoveTime = now;
      mixpanel.track('Mouse Movement', {
        session_id: sessionId,
        visitor_id: visitorId,
        x_position: e.clientX,
        y_position: e.clientY,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        url: window.location.href
      });
    }
  });
  
  // Track scroll events with additional data for better replay
  let lastScrollTime = 0;
  window.addEventListener('scroll', () => {
    const now = Date.now();
    if (now - lastScrollTime > 1000) {
      lastScrollTime = now;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      mixpanel.track('Scroll Position', {
        session_id: sessionId,
        visitor_id: visitorId,
        scroll_top: scrollTop,
        scroll_left: scrollLeft,
        viewport_height: window.innerHeight,
        viewport_width: window.innerWidth,
        document_height: document.documentElement.scrollHeight,
        document_width: document.documentElement.scrollWidth,
        url: window.location.href
      });
    }
  });
  
  // Track session end when possible
  window.addEventListener('beforeunload', () => {
    mixpanel.track('Session End', {
      session_id: sessionId,
      visitor_id: visitorId,
      duration_seconds: (Date.now() - parseInt(sessionId.split('_')[1])) / 1000,
      url: window.location.href
    });
    
    // Stop session recording
    try {
      if ((mixpanel as any).session_recording && isSessionRecordingActive) {
        (mixpanel as any).session_recording.stop();
      }
    } catch (e) {
      console.error('Session recording stop error:', e);
    }
  });
}

// Track page views
export const trackPageView = (pageName: string, properties = {}) => {
  if (!isBrowser) return;
  
  // Capture a snapshot at each page view for better session replay
  captureReplaySnapshot('page_view');
  
  mixpanel.track('Page View', {
    session_id: sessionId,
    visitor_id: visitorId,
    page: pageName,
    url: window.location.pathname,
    ...properties
  });
};

// Track scroll depth
let lastScrollDepth = 0;
export const trackScrollDepth = () => {
  if (!isBrowser) return;
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrollDepth = Math.round((scrollTop / scrollHeight) * 100);
  
  // Only track scroll depth when it changes significantly (10% increments)
  const scrollBracket = Math.floor(scrollDepth / 10) * 10;
  if (scrollBracket > lastScrollDepth) {
    lastScrollDepth = scrollBracket;
    mixpanel.track('Scroll Depth', {
      session_id: sessionId,
      visitor_id: visitorId,
      depth: scrollBracket,
      page: window.location.pathname
    });
  }
};

// Track button clicks
export const trackButtonClick = (buttonName: string, properties = {}) => {
  if (!isBrowser) return;
  
  mixpanel.track('Button Click', {
    session_id: sessionId,
    visitor_id: visitorId,
    button: buttonName,
    page: window.location.pathname,
    ...properties
  });
};

// Track search actions
export const trackSearch = (query: string, resultCount: number, properties = {}) => {
  if (!isBrowser) return;
  
  mixpanel.track('Search', {
    session_id: sessionId,
    visitor_id: visitorId,
    query,
    resultCount,
    page: window.location.pathname,
    ...properties
  });
};

// Track search result clicks
export const trackSearchResultClick = (resultIndex: number, resultName: string, linkedInUrl: string) => {
  if (!isBrowser) return;
  
  mixpanel.track('Search Result Click', {
    session_id: sessionId,
    visitor_id: visitorId,
    resultIndex,
    resultName,
    linkedInUrl,
    page: window.location.pathname
  });
};

// Track modal interactions
export const trackModalOpen = (modalName: string, properties = {}) => {
  if (!isBrowser) return;
  
  mixpanel.track('Modal Open', {
    session_id: sessionId,
    visitor_id: visitorId,
    modal: modalName,
    page: window.location.pathname,
    ...properties
  });
};

export const trackModalClose = (modalName: string, properties = {}) => {
  if (!isBrowser) return;
  
  mixpanel.track('Modal Close', {
    session_id: sessionId,
    visitor_id: visitorId,
    modal: modalName,
    page: window.location.pathname,
    ...properties
  });
};

// Track form submissions
export const trackFormSubmit = (formName: string, properties = {}) => {
  if (!isBrowser) return;
  
  mixpanel.track('Form Submit', {
    session_id: sessionId,
    visitor_id: visitorId,
    form: formName,
    page: window.location.pathname,
    ...properties
  });
};

// Track tag clicks
export const trackTagClick = (tagName: string, properties = {}) => {
  if (!isBrowser) return;
  
  mixpanel.track('Tag Click', {
    session_id: sessionId,
    visitor_id: visitorId,
    tag: tagName,
    page: window.location.pathname,
    ...properties
  });
};

// Track Learn mode questions
export const trackLearnModeQuestion = (question: string, properties = {}) => {
  if (!isBrowser) return;
  
  mixpanel.track('Learn Mode Question', {
    session_id: sessionId,
    visitor_id: visitorId,
    question,
    page: window.location.pathname,
    ...properties
  });
};

// Track feature spotlight interactions
export const trackFeatureSpotlight = (action: 'view' | 'dismiss', properties = {}) => {
  if (!isBrowser) return;
  
  mixpanel.track('Feature Spotlight', {
    session_id: sessionId,
    visitor_id: visitorId,
    action,
    page: window.location.pathname,
    ...properties
  });
};

// Track ProTip interactions
export const trackProTip = (action: 'view' | 'dismiss', properties = {}) => {
  if (!isBrowser) return;
  
  mixpanel.track('Pro Tip', {
    session_id: sessionId,
    visitor_id: visitorId,
    action,
    page: window.location.pathname,
    ...properties
  });
};

// Set user properties while maintaining the visitor ID
export const setUserProperties = (properties = {}) => {
  if (!isBrowser) return;
  
  // Keep the unique visitor ID but set additional properties
  mixpanel.people.set({
    // Include visitor ID with properties
    visitor_id: visitorId,
    ...properties
  });
};

// Identify user with custom ID while maintaining the visitor tracking
export const identifyUser = (userId: string, properties = {}) => {
  if (!isBrowser) return;
  
  // For demo users, we want to track them as unique visitors
  // but still associate them with the demo account
  
  // Store original ID for database queries
  const originalUserId = userId;
  
  // Use visitor ID for tracking but associate with demo status
  if (userId === "maimondavid553@gmail.com") {
    // Don't identify as the demo email - keep the unique visitor ID
    // But set properties to indicate this is a demo user
    mixpanel.people.set({
      visitor_id: visitorId,
      is_demo_user: true,
      demo_email: originalUserId,
      original_id: originalUserId,
      ...properties
    });
    
    console.log(`Demo user identified as unique visitor: ${visitorId}`);
  } else {
    // For non-demo users, use their actual email as identifier
    mixpanel.identify(userId);
    mixpanel.people.set({
      visitor_id: visitorId,
      email: userId,
      ...properties
    });
  }
};

// Track errors
export const trackError = (errorType: string, errorMessage: string, properties = {}) => {
  if (!isBrowser) return;
  
  mixpanel.track('Error', {
    session_id: sessionId,
    visitor_id: visitorId,
    errorType,
    errorMessage,
    page: window.location.pathname,
    ...properties
  });
};

// Get visitor ID (exposed for components that need it)
export const getVisitorId = () => {
  if (!isBrowser) return '';
  return visitorId;
};

// Additional function to force a session replay snapshot
export const captureReplaySnapshot = (reason: string = 'manual_capture') => {
  if (!isBrowser) return;
  
  try {
    mixpanel.track('Replay Snapshot', {
      session_id: sessionId,
      visitor_id: visitorId,
      reason: reason,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      os: detectOperatingSystem()
    });
    
    // Force snapshot capture if the API is available
    if ((mixpanel as any).session_recording && isSessionRecordingActive) {
      try {
        (mixpanel as any).session_recording.snapshot();
      } catch (e) {
        console.log('Standard snapshot API failed, trying alternative approach');
        // Alternative approach for browsers that don't support the standard API
        mixpanel.track('DOM Snapshot', {
          session_id: sessionId,
          visitor_id: visitorId,
          html_length: document.documentElement.innerHTML.length,
          visible_elements: document.querySelectorAll('*:not([hidden]):not([style*="display: none"])').length,
          url: window.location.href
        });
      }
    }
  } catch (e) {
    console.error('Error capturing replay snapshot:', e);
  }
};

export default {
  initSessionRecording,
  trackPageView,
  trackScrollDepth,
  trackButtonClick,
  trackSearch,
  trackSearchResultClick,
  trackModalOpen,
  trackModalClose,
  trackFormSubmit,
  trackTagClick,
  trackLearnModeQuestion,
  trackFeatureSpotlight,
  trackProTip,
  setUserProperties,
  identifyUser,
  trackError,
  getVisitorId,
  captureReplaySnapshot
}; 