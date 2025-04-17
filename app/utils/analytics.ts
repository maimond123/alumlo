import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel with your project token
const MIXPANEL_TOKEN = '734da60febbf101dd204ef6d430dbfeb';
mixpanel.init(MIXPANEL_TOKEN);

// Track page views
export const trackPageView = (pageName: string, properties = {}) => {
  mixpanel.track('Page View', {
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
      depth: scrollBracket,
      page: window.location.pathname
    });
  }
};

// Track button clicks
export const trackButtonClick = (buttonName: string, properties = {}) => {
  mixpanel.track('Button Click', {
    button: buttonName,
    page: window.location.pathname,
    ...properties
  });
};

// Track search actions
export const trackSearch = (query: string, resultCount: number, properties = {}) => {
  mixpanel.track('Search', {
    query,
    resultCount,
    page: window.location.pathname,
    ...properties
  });
};

// Track search result clicks
export const trackSearchResultClick = (resultIndex: number, resultName: string, linkedInUrl: string) => {
  mixpanel.track('Search Result Click', {
    resultIndex,
    resultName,
    linkedInUrl,
    page: window.location.pathname
  });
};

// Track modal interactions
export const trackModalOpen = (modalName: string, properties = {}) => {
  mixpanel.track('Modal Open', {
    modal: modalName,
    page: window.location.pathname,
    ...properties
  });
};

export const trackModalClose = (modalName: string, properties = {}) => {
  mixpanel.track('Modal Close', {
    modal: modalName,
    page: window.location.pathname,
    ...properties
  });
};

// Track form submissions
export const trackFormSubmit = (formName: string, properties = {}) => {
  mixpanel.track('Form Submit', {
    form: formName,
    page: window.location.pathname,
    ...properties
  });
};

// Track tag clicks
export const trackTagClick = (tagName: string, properties = {}) => {
  mixpanel.track('Tag Click', {
    tag: tagName,
    page: window.location.pathname,
    ...properties
  });
};

// Track feature spotlight interactions
export const trackFeatureSpotlight = (action: 'view' | 'dismiss', properties = {}) => {
  mixpanel.track('Feature Spotlight', {
    action,
    page: window.location.pathname,
    ...properties
  });
};

// Track ProTip interactions
export const trackProTip = (action: 'view' | 'dismiss', properties = {}) => {
  mixpanel.track('Pro Tip', {
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
    errorType,
    errorMessage,
    page: window.location.pathname,
    ...properties
  });
};

export default {
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