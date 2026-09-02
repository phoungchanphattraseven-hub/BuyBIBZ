# Orders Page Troubleshooting Guide

## Current Status
- ✅ Backend API running on http://127.0.0.1:8000
- ✅ Frontend running on http://localhost:5500
- ✅ 4 test orders exist in database
- ⚠️ Orders page showing skeleton loaders

## Step-by-Step Debugging

### Step 1: Open Browser Developer Tools
1. Open http://localhost:5500/orders.html
2. Press `F12` to open Developer Tools
3. Click on the **Console** tab
4. Look for any error messages (they will be in red)

### Step 2: Check for Specific Errors

#### If you see "Unexpected token '<'" or "Unexpected identifier":
- This is a JavaScript syntax error
- Check the console for the exact line number
- The file has been fixed but browser cache might need clearing

#### If you see "Missing or invalid authorization header":
- You are not logged in
- Go to http://localhost:5500/auth.html
- Login with:
  - Email: `adminbuybiz@gmail.com`
  - Password: `BuyBIBZyourAdmin737`
- Then go back to orders page

#### If you see "Cannot connect to server":
- Backend is not running
- Run: `cd backend && python -m uvicorn main:app --reload`

#### If you see nothing in console:
- JavaScript files are not loading
- Check Network tab for failed requests
- Try hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

### Step 3: Use Test Pages

#### Test 1: Simple Orders Test
1. Go to: http://localhost:5500/simple-orders-test.html
2. This will show you exactly where the problem is
3. Follow the error messages

#### Test 2: Debug Orders Tool
1. Go to: http://localhost:5500/debug-orders.html
2. Click "Login" button
3. Click "Run All Tests"
4. This will test:
   - Authentication
   - API connection
   - Orders endpoint

### Step 4: Check Browser Console Logs

After opening orders.html, you should see these console logs:
```
orders.html script loaded
DOMContentLoaded fired
requireAuth passed, starting loadOrders
Loading orders...
User is logged in, calling API...
Orders API response: {orders: Array(4)}
loadOrders completed
```

If any of these are missing, note which one and check the corresponding issue below:

- **Missing "script loaded"**: JavaScript file not loading
- **Missing "DOMContentLoaded"**: Page not fully loading
- **Missing "requireAuth passed"**: User not logged in
- **Missing "Loading orders"**: loadOrders function not being called
- **Missing "API response"**: API call failing

### Step 5: Clear Browser Cache

If the page was working before but stopped:
1. Open Developer Tools (F12)
2. Right-click on the refresh button
3. Select "Empty Cache and Hard Reload"
4. Or use: `Ctrl + Shift + Delete` → Clear cached images and files

### Step 6: Verify Backend is Working

Test the API directly:
```powershell
cd c:\Users\Asus\OneDrive\Desktop\Ecommerce_pf
python test_orders_api.py
```

You should see:
```
✅ Admin login successful
✅ Orders API working
📦 Found 4 order(s)
```

If this fails, the backend has an issue.

### Step 7: Check Network Tab

1. Open Developer Tools (F12)
2. Click **Network** tab
3. Refresh the page
4. Look for a request to `/api/orders`
5. Check the response:
   - **200 OK**: API is working, check the response data
   - **401 Unauthorized**: Not logged in
   - **500 Server Error**: Backend error
   - **Failed**: Backend not running or CORS issue

## Common Solutions

### Solution 1: Login Again
```
1. Go to http://localhost:5500/auth.html
2. Login with admin credentials
3. Go back to orders page
```

### Solution 2: Restart Servers
```powershell
# Stop any running servers (Ctrl+C in terminal)

# Start backend
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# In another terminal, start frontend
cd frontend
python -m http.server 5500
```

### Solution 3: Clear Browser Storage
```
1. Open Developer Tools (F12)
2. Go to Application tab
3. Click "Clear storage"
4. Click "Clear site data"
5. Refresh page
```

### Solution 4: Check JavaScript Files
Make sure these files exist and are loading:
- js/api.js
- js/auth.js
- js/app.js
- js/i18n.js

## Expected Behavior

When everything works correctly:
1. Page loads with skeleton loaders
2. If not logged in, redirect to auth page
3. If logged in, API call is made
4. Skeleton disappears
5. Orders are displayed in cards
6. Each order shows:
   - Order ID
   - Status badge
   - Total price
   - Item count
   - Expandable details

## Still Having Issues?

1. **Take a screenshot** of the browser console (F12 → Console tab)
2. **Note any error messages** (copy the full text)
3. **Check which test page works**:
   - simple-orders-test.html
   - debug-orders.html
4. **Share the console output** for further debugging

## Quick Fix Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5500
- [ ] Logged in as admin
- [ ] Browser cache cleared
- [ ] No red errors in console
- [ ] Network tab shows 200 response for /api/orders
