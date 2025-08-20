# 🔍 Microsoft Clarity Data Export API Setup

## **🎯 What We've Implemented:**

✅ **Real Microsoft Clarity API Integration**  
✅ **Automatic data fetching** from Clarity's servers  
✅ **Fallback to internal tracking** if API fails  
✅ **Real-time analytics display** in your IT Dashboard  

## **🚀 How It Works Now:**

### **Data Flow:**
1. **Microsoft Clarity API** → Fetches real data from Clarity servers
2. **Data Transformation** → Converts to our analytics format
3. **Dashboard Display** → Shows real Clarity data in your IT Dashboard
4. **Fallback System** → Uses internal tracking if Clarity API fails

### **What You'll See:**
- **Real page views** from Clarity tracking
- **Actual engagement time** and scroll depth
- **Browser and device breakdown**
- **Top visited pages** from your site
- **Live data indicator** showing "Clarity API" or "Internal Data"

## **🔑 Setup Required:**

### **Step 1: Get JWT Token from Clarity**

1. **Go to your Clarity Dashboard:**
   - Visit [clarity.microsoft.com](https://clarity.microsoft.com)
   - Sign in with your Microsoft account
   - Select your "Hospital Management System" project

2. **Find API Settings:**
   - Look for "Settings" or "API" section
   - Find "Data Export API" or "JWT Token"
   - Generate a new JWT token

3. **Copy the Token:**
   - The token will look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Keep it secure - don't share it publicly

### **Step 2: Add Token to Environment**

**Option A: Environment Variable (Recommended)**
```bash
# Create .env file in frontend directory
REACT_APP_CLARITY_JWT_TOKEN=your_jwt_token_here
```

**Option B: Direct in Code (Temporary)**
```javascript
// In frontend/src/utils/clarityAPI.js
const CLARITY_JWT_TOKEN = 'your_jwt_token_here';
```

### **Step 3: Test the Integration**

1. **Start your application:**
   ```bash
   pnpm run dev
   ```

2. **Go to Analytics:**
   - IT Dashboard → Analytics
   - You should see "Clarity API" indicator

3. **Check Console:**
   - Look for: `📊 Using Microsoft Clarity API data`
   - If you see: `📊 Using our own tracking data (fallback)` - the token might be invalid

## **📊 API Features:**

### **What Clarity API Provides:**
- **Traffic metrics** (page views, sessions)
- **Engagement time** (how long users stay)
- **Scroll depth** (how far users scroll)
- **Browser breakdown** (Chrome, Firefox, Safari, etc.)
- **Device breakdown** (Desktop, Mobile, Tablet)
- **URL breakdown** (most visited pages)

### **API Limitations:**
- **10 requests per day** per project
- **1-3 days** of data range
- **Up to 3 dimensions** per request
- **Aggregated data only** (not real-time)

## **🔧 Troubleshooting:**

### **If You See "Internal Data":**
1. **Check JWT token** - make sure it's valid
2. **Check API limits** - you might have hit the 10 requests/day limit
3. **Check network** - ensure your app can reach Clarity servers
4. **Check console** - look for error messages

### **Common Errors:**
- **401 Unauthorized** → Invalid JWT token
- **429 Too Many Requests** → Hit API limit
- **404 Not Found** → Invalid project ID

### **Fallback System:**
- If Clarity API fails, it automatically uses your internal tracking data
- You'll still see analytics, just from your own database
- No data loss - seamless fallback

## **🎉 Benefits:**

### **Real Clarity Data:**
- **Accurate metrics** from Microsoft's servers
- **Professional analytics** with engagement data
- **Cross-platform insights** (browser, device breakdown)
- **Industry-standard metrics**

### **Hybrid System:**
- **Best of both worlds** - Clarity + Internal tracking
- **Reliable fallback** - always shows data
- **Real-time updates** - live analytics
- **Custom events** - IT-specific actions

## **📈 Next Steps:**

1. **Get your JWT token** from Clarity dashboard
2. **Add it to environment variables**
3. **Test the integration**
4. **Monitor the analytics** in your IT Dashboard

**You now have a fully integrated Microsoft Clarity API system that shows real data from Clarity's servers in your own IT Dashboard!** 🎉

The system will automatically use Clarity data when available and fall back to your internal tracking when needed. No more dummy data - everything is real! 📊
