// Microsoft Clarity Utility Functions
// This file provides custom tracking for the IT Dashboard

// Initialize Clarity (call this after Clarity script loads)
export const initializeClarity = () => {
  if (typeof window !== 'undefined' && window.clarity) {
    console.log('🔍 Microsoft Clarity initialized');
    return true;
  }
  return false;
};

// Track page views with custom metadata
export const trackPageView = (pageName, metadata = {}) => {
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity("set", "page_name", pageName);
    window.clarity("set", "page_metadata", JSON.stringify(metadata));
    console.log(`📊 Clarity: Page view tracked - ${pageName}`, metadata);
  }
};

// Track user actions
export const trackUserAction = (action, details = {}) => {
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity("event", action, details);
    console.log(`📊 Clarity: Action tracked - ${action}`, details);
  }
};

// Track IT Dashboard specific events
export const trackITDashboardEvent = {
  // User Management Events
  userSuspended: (userId, userEmail, reason) => {
    trackUserAction('user_suspended', {
      userId,
      userEmail,
      reason,
      timestamp: new Date().toISOString()
    });
  },

  userActivated: (userId, userEmail) => {
    trackUserAction('user_activated', {
      userId,
      userEmail,
      timestamp: new Date().toISOString()
    });
  },

  userRoleChanged: (userId, oldRole, newRole) => {
    trackUserAction('user_role_changed', {
      userId,
      oldRole,
      newRole,
      timestamp: new Date().toISOString()
    });
  },

  // System Management Events
  maintenanceModeEnabled: (reason, duration) => {
    trackUserAction('maintenance_mode_enabled', {
      reason,
      duration,
      timestamp: new Date().toISOString()
    });
  },

  maintenanceModeDisabled: () => {
    trackUserAction('maintenance_mode_disabled', {
      timestamp: new Date().toISOString()
    });
  },

  systemLockEnabled: (reason) => {
    trackUserAction('system_lock_enabled', {
      reason,
      timestamp: new Date().toISOString()
    });
  },

  systemLockDisabled: () => {
    trackUserAction('system_lock_disabled', {
      timestamp: new Date().toISOString()
    });
  },

  // Security Events
  securityAlertViewed: (alertId, alertType) => {
    trackUserAction('security_alert_viewed', {
      alertId,
      alertType,
      timestamp: new Date().toISOString()
    });
  },

  supportTicketCreated: (ticketId, ticketType) => {
    trackUserAction('support_ticket_created', {
      ticketId,
      ticketType,
      timestamp: new Date().toISOString()
    });
  },

  // Navigation Events
  dashboardSectionAccessed: (section) => {
    trackUserAction('dashboard_section_accessed', {
      section,
      timestamp: new Date().toISOString()
    });
  },

  searchPerformed: (searchTerm, resultsCount) => {
    trackUserAction('search_performed', {
      searchTerm,
      resultsCount,
      timestamp: new Date().toISOString()
    });
  },

  // Performance Events
  slowLoadingDetected: (component, loadTime) => {
    trackUserAction('slow_loading_detected', {
      component,
      loadTime,
      timestamp: new Date().toISOString()
    });
  },

  errorOccurred: (errorType, errorMessage, page) => {
    trackUserAction('error_occurred', {
      errorType,
      errorMessage,
      page,
      timestamp: new Date().toISOString()
    });
  }
};

// Track user session information
export const trackUserSession = (userRole, permissions = []) => {
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity("set", "user_role", userRole);
    window.clarity("set", "user_permissions", JSON.stringify(permissions));
    window.clarity("set", "session_start", new Date().toISOString());
    console.log(`📊 Clarity: Session tracked - Role: ${userRole}`);
  }
};

// Track performance metrics
export const trackPerformance = (metric, value) => {
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity("set", `perf_${metric}`, value);
    console.log(`📊 Clarity: Performance tracked - ${metric}: ${value}`);
  }
};

// Custom event for IT Dashboard analytics
export const trackITAnalytics = (eventName, data = {}) => {
  if (typeof window !== 'undefined' && window.clarity) {
    const eventData = {
      ...data,
      dashboard: 'IT',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    
    window.clarity("event", `it_dashboard_${eventName}`, eventData);
    console.log(`📊 Clarity: IT Analytics - ${eventName}`, eventData);
  }
};

// Track feature usage
export const trackFeatureUsage = (feature, action, details = {}) => {
  trackITAnalytics('feature_usage', {
    feature,
    action,
    ...details
  });
};

// Track system health events
export const trackSystemHealth = (component, status, details = {}) => {
  trackITAnalytics('system_health', {
    component,
    status,
    ...details
  });
};

// Track user workflow
export const trackWorkflow = (workflow, step, duration = null) => {
  trackITAnalytics('workflow', {
    workflow,
    step,
    duration,
    timestamp: new Date().toISOString()
  });
};

export default {
  initializeClarity,
  trackPageView,
  trackUserAction,
  trackITDashboardEvent,
  trackUserSession,
  trackPerformance,
  trackITAnalytics,
  trackFeatureUsage,
  trackSystemHealth,
  trackWorkflow
};
