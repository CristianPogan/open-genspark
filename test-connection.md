# Connection Test Guide

## Issue Identified

Your Composio accounts are connected with:
- **User ID**: `pg-test-5f61ece2-3b93-42b2-814a-43cffdd86cfa`
- **Google Drive**: Account ID `ca_VB1SeVOmfFzh`, Status ACTIVE
- **Google Slides**: Account ID `ca_SHXaKQzToSBp`, Status ACTIVE

However, the application generates random userIds when users aren't authenticated, which won't match your Composio accounts.

## Testing Steps

1. **Check your current userId in the app:**
   - Open browser DevTools → Application → Cookies
   - Look for `googlesheet_user_id` or `googledoc_user_id`
   - Note the value

2. **Test the connection diagnostic endpoint:**
   ```
   GET /api/check-connections?userId=pg-test-5f61ece2-3b93-42b2-814a-43cffdd86cfa
   ```
   
   Or visit in browser (if you're logged in):
   ```
   https://your-app.vercel.app/api/check-connections
   ```

3. **If userIds don't match:**
   - Option A: Use the Composio userId by setting it manually
   - Option B: Connect accounts through the app's `/signin` page (creates new connections)

## Solutions

### Solution 1: Use Composio UserId (Recommended for testing)

Set the cookie manually or update the app to use your Composio userId:
```javascript
// In browser console:
document.cookie = "googlesheet_user_id=pg-test-5f61ece2-3b93-42b2-814a-43cffdd86cfa; path=/; max-age=31536000";
```

### Solution 2: Connect through App

Visit `/signin` and connect Google Sheets/Docs through the app's OAuth flow. This will create new connections with the app's generated userId.

## What Was Fixed

1. ✅ Added Google Drive toolkit support to `/api/superagent`
2. ✅ Added Google Slides toolkit support to `/api/superagent`
3. ✅ Created diagnostic endpoint `/api/check-connections` to verify connections
4. ⚠️ **UserId mismatch**: App generates random IDs, Composio uses `pg-test-5f61ece2-3b93-42b2-814a-43cffdd86cfa`

