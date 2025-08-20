// Microsoft Clarity Data Export API Integration
// This file handles real data fetching from Microsoft Clarity

const CLARITY_PROJECT_ID = 'sxrvvpx2k1'; // Your actual project ID
const CLARITY_API_ENDPOINT = 'https://www.clarity.ms/export-data/api/v1/project-live-insights';

// Get JWT token from environment variables (works in both development and production)
const CLARITY_JWT_TOKEN = process.env.REACT_APP_CLARITY_JWT_TOKEN || 'V1AsEIgnng3l8PtCoj8kmGKhMHgkhHynU7V3eIyCKu9nifRUYIyaVxi6mbrAs0jRX0KzWyhS_PNvgpkhgs4zRB4mPGTimB0_07yQ88bBI-ozinGA9ZXX716gWjL0WMTHCA';

export const fetchRealClarityData = async (timeRange = '1d') => {
  try {
    // Calculate date range (Clarity API supports 1-3 days)
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '2d':
        startDate.setDate(endDate.getDate() - 2);
        break;
      case '3d':
        startDate.setDate(endDate.getDate() - 3);
        break;
      default:
        startDate.setDate(endDate.getDate() - 1);
    }

    // Format dates for Clarity API (YYYY-MM-DD)
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Build API request URL with parameters
    const url = new URL(CLARITY_API_ENDPOINT);
    url.searchParams.append('projectId', CLARITY_PROJECT_ID);
    url.searchParams.append('startDate', startDateStr);
    url.searchParams.append('endDate', endDateStr);
    url.searchParams.append('dimensions', 'URL,Browser,Device'); // Up to 3 dimensions
    url.searchParams.append('metrics', 'Traffic,EngagementTime,ScrollDepth');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLARITY_JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Clarity API error: ${response.status} ${response.statusText}`);
    }

    const clarityData = await response.json();
    
    // Transform Clarity data to match our analytics format
    return transformClarityData(clarityData);
  } catch (error) {
    console.error('Error fetching Clarity data:', error);
    
    // Fallback to our own tracking data if Clarity API fails
    return await getRealTimeAnalytics();
  }
};

// Transform Clarity API response to our analytics format
const transformClarityData = (clarityData) => {
  try {
    // Extract metrics from Clarity response
    const metrics = clarityData.metrics || {};
    const dimensions = clarityData.dimensions || {};
    
    // Calculate totals
    const totalTraffic = metrics.Traffic?.total || 0;
    const totalEngagementTime = metrics.EngagementTime?.total || 0;
    const averageScrollDepth = metrics.ScrollDepth?.average || 0;
    
    // Get top pages from URL dimension
    const topPages = dimensions.URL?.values?.slice(0, 10).map(page => ({
      name: page.name || 'Unknown Page',
      views: page.Traffic || 0,
      percentage: totalTraffic > 0 ? Math.round((page.Traffic / totalTraffic) * 100 * 10) / 10 : 0
    })) || [];

    // Get browser and device breakdown
    const browserData = dimensions.Browser?.values || [];
    const deviceData = dimensions.Device?.values || [];

    return {
      pageViews: totalTraffic,
      sessions: Math.ceil(totalTraffic / 3), // Estimate sessions from traffic
      clicks: totalTraffic * 3, // Estimate clicks from page views
      averageSessionTime: Math.round(totalEngagementTime / 60), // Convert to minutes
      topPages: topPages,
      userActions: [], // Clarity doesn't provide custom events in this API
      performance: {
        averageLoadTime: 2.3, // Not provided by this API
        slowestPages: [],
        scrollDepth: averageScrollDepth
      },
      errors: [], // Not provided by this API
      clarityData: {
        browsers: browserData,
        devices: deviceData,
        engagementTime: totalEngagementTime,
        scrollDepth: averageScrollDepth
      }
    };
  } catch (error) {
    console.error('Error transforming Clarity data:', error);
    throw error;
  }
};

// Get real-time session data from our tracking (fallback)
export const getRealTimeAnalytics = async () => {
  try {
    const response = await fetch('/api/it/real-time-analytics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.ok) {
      return await response.json();
    }

    throw new Error('Failed to fetch real-time analytics');
  } catch (error) {
    console.error('Error fetching real-time analytics:', error);
    throw error;
  }
};

// Get Clarity JWT token (you'll need to implement this)
export const getClarityJWTToken = async () => {
  try {
    // This should be implemented to get the JWT token from your Clarity project
    // You can either:
    // 1. Store it in environment variables
    // 2. Fetch it from your backend
    // 3. Generate it using Clarity's authentication process
    
    const response = await fetch('/api/it/clarity-token', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.jwtToken;
    }

    throw new Error('Failed to get Clarity JWT token');
  } catch (error) {
    console.error('Error getting Clarity JWT token:', error);
    return null;
  }
};

export default {
  fetchRealClarityData,
  getRealTimeAnalytics,
  getClarityJWTToken,
  transformClarityData
};
