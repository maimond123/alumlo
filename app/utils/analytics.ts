import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel with your project token
const MIXPANEL_TOKEN = '734da60febbf101dd204ef6d430dbfeb';

// Configure Mixpanel with session recording enabled
mixpanel.init(MIXPANEL_TOKEN, {
  debug: process.env.NODE_ENV !== 'production',
  track_pageview: true,
  persistence: 'localStorage',
  api_host: 'https://api.mixpanel.com',
  cookie_name: 'alumIntel_mp',
  secure_cookie: true,
  ip: false,
  property_blacklist: ['$current_url', '$initial_referrer', '$referrer'],
  loaded: () => {
    // Enable session recording for 100% of users
    mixpanel.set_config({ 'record_sessions_percent': 100 });
  }
});

// Session ID to link events together
let sessionId = generateSessionId();

// Generate a unique session ID
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

// Initialize session recording and advanced tracking
export const initSessionRecording = () => {
  try {
    // Reset session ID for new sessions
    sessionId = generateSessionId();
    
    // Track session start
    mixpanel.track('Session Start', {
      session_id: sessionId,
      referrer: document.referrer,
      landing_page: window.location.href,
      user_agent: navigator.userAgent,
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
      device_pixel_ratio: window.devicePixelRatio || 1
    });
    
    // Set up global event listeners for comprehensive tracking
    setupGlobalEventListeners();
    
    console.log('Mixpanel session recording initialized with ID:', sessionId);
  } catch (error) {
    console.error('Failed to initialize session recording:', error);
  }
};

// Setup global event listeners for session recording
function setupGlobalEventListeners() {
  // Track all clicks
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    const classes = target.className;
    const id = target.id;
    const text = target.textContent?.trim().substring(0, 50);
    
    mixpanel.track('Element Click', {
      session_id: sessionId,
      element_type: tagName,
      element_id: id || undefined,
      element_class: classes || undefined,
      element_text: text || undefined,
      x_position: e.clientX,
      y_position: e.clientY
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
      
      mixpanel.track('Form Field Interaction', {
        session_id: sessionId,
        field_type: fieldType,
        field_name: fieldName,
        has_value: !!inputElement.value
      });
    }
  });
  
  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    mixpanel.track('Visibility Change', {
      session_id: sessionId,
      is_visible: !document.hidden
    });
  });
  
  // Track user leaving/returning to window
  window.addEventListener('blur', () => {
    mixpanel.track('Window Blur', {
      session_id: sessionId,
      time: new Date().toISOString()
    });
  });
  
  window.addEventListener('focus', () => {
    mixpanel.track('Window Focus', {
      session_id: sessionId,
      time: new Date().toISOString()
    });
  });
  
  // Track session end when possible
  window.addEventListener('beforeunload', () => {
    mixpanel.track('Session End', {
      session_id: sessionId,
      duration_seconds: (Date.now() - parseInt(sessionId.split('_')[1])) / 1000
    });
  });
}

// Track page views
export const trackPageView = (pageName: string, properties = {}) => {
  mixpanel.track('Page View', {
    session_id: sessionId,
    page: pageName,
    url: window.location.pathname,
    ...properties
  });
};

// Track scroll depth
let lastScrollDepth = 0;
export const trackScrollDepth = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrollDepth = Math.round((scrollTop / scrollHeight) * 100);
  
  // Only track scroll depth when it changes significantly (10% increments)
  const scrollBracket = Math.floor(scrollDepth / 10) * 10;
  if (scrollBracket > lastScrollDepth) {
    lastScrollDepth = scrollBracket;
    mixpanel.track('Scroll Depth', {
      session_id: sessionId,
      depth: scrollBracket,
      page: window.location.pathname
    });
  }
};

// Track button clicks
export const trackButtonClick = (buttonName: string, properties = {}) => {
  mixpanel.track('Button Click', {
    session_id: sessionId,
    button: buttonName,
    page: window.location.pathname,
    ...properties
  });
};

// Track search actions
export const trackSearch = (query: string, resultCount: number, properties = {}) => {
  mixpanel.track('Search', {
    session_id: sessionId,
    query,
    resultCount,
    page: window.location.pathname,
    ...properties
  });
};

// Track search result clicks
export const trackSearchResultClick = (resultIndex: number, resultName: string, linkedInUrl: string) => {
  mixpanel.track('Search Result Click', {
    session_id: sessionId,
    resultIndex,
    resultName,
    linkedInUrl,
    page: window.location.pathname
  });
};

// Track modal interactions
export const trackModalOpen = (modalName: string, properties = {}) => {
  mixpanel.track('Modal Open', {
    session_id: sessionId,
    modal: modalName,
    page: window.location.pathname,
    ...properties
  });
};

export const trackModalClose = (modalName: string, properties = {}) => {
  mixpanel.track('Modal Close', {
    session_id: sessionId,
    modal: modalName,
    page: window.location.pathname,
    ...properties
  });
};

// Track form submissions
export const trackFormSubmit = (formName: string, properties = {}) => {
  mixpanel.track('Form Submit', {
    session_id: sessionId,
    form: formName,
    page: window.location.pathname,
    ...properties
  });
};

// Track tag clicks
export const trackTagClick = (tagName: string, properties = {}) => {
  mixpanel.track('Tag Click', {
    session_id: sessionId,
    tag: tagName,
    page: window.location.pathname,
    ...properties
  });
};

// Track feature spotlight interactions
export const trackFeatureSpotlight = (action: 'view' | 'dismiss', properties = {}) => {
  mixpanel.track('Feature Spotlight', {
    session_id: sessionId,
    action,
    page: window.location.pathname,
    ...properties
  });
};

// Track ProTip interactions
export const trackProTip = (action: 'view' | 'dismiss', properties = {}) => {
  mixpanel.track('Pro Tip', {
    session_id: sessionId,
    action,
    page: window.location.pathname,
    ...properties
  });
};

// Track user properties
export const setUserProperties = (properties = {}) => {
  mixpanel.people.set(properties);
};

// Identify user
export const identifyUser = (userId: string, properties = {}) => {
  mixpanel.identify(userId);
  if (Object.keys(properties).length > 0) {
    mixpanel.people.set(properties);
  }
};

// Track errors
export const trackError = (errorType: string, errorMessage: string, properties = {}) => {
  mixpanel.track('Error', {
    session_id: sessionId,
    errorType,
    errorMessage,
    page: window.location.pathname,
    ...properties
  });
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
  trackFeatureSpotlight,
  trackProTip,
  setUserProperties,
  identifyUser,
  trackError
}; 