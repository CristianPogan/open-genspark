# Stability Tests for GenSpark Application

## Identified Issues from Logs

### 1. ✅ FIXED: Google Slides Creation Tool Mismatch
- **Issue**: Code was looking for `GOOGLESLIDES_CREATE_PRESENTATION` but actual tool is `GOOGLESLIDES_PRESENTATIONS_CREATE`
- **Status**: Fixed in code
- **Impact**: 500 errors when creating Google Slides

### 2. ⚠️ Unconnected Google Account
- **Issue**: User doesn't have Google Slides account connected (0 connected accounts)
- **Status**: Expected behavior - returns 401 with helpful message
- **Impact**: Users need to sign in via `/signin` first

### 3. ⚠️ Composio SDK Version Warning
- **Issue**: Using version 0.1.35, latest is 0.3.4
- **Status**: Non-critical, but should upgrade
- **Impact**: May miss new features/bug fixes

## Test Scenarios

### API Endpoint Tests

#### 1. `/api/superagent` - Main Chat Endpoint
**Test Cases:**
- ✅ Normal request with prompt
- ⚠️ Empty prompt (should return 400)
- ⚠️ Missing environment variables (should return 500)
- ⚠️ Very long prompt (>10k chars)
- ⚠️ Special characters in prompt
- ⚠️ Concurrent requests (5+ simultaneous)
- ⚠️ Request timeout (>30s)
- ⚠️ Invalid JSON body

**Expected Behavior:**
- Returns 200 with response
- Handles errors gracefully
- Logs all requests with requestId
- Sets userId cookie if missing

#### 2. `/api/create-google-slides` - Google Slides Creation
**Test Cases:**
- ✅ Valid slides array
- ⚠️ Empty slides array (should return 400)
- ⚠️ Unconnected account (should return 401)
- ⚠️ Invalid slide structure
- ⚠️ Very large slides array (50+ slides)
- ⚠️ Missing title
- ⚠️ Special characters in title/content

**Expected Behavior:**
- Creates presentation if account connected
- Returns 401 if account not connected
- Returns 500 if tool not found (should be fixed now)

#### 3. `/api/health` - Health Check
**Test Cases:**
- ✅ Normal request
- ⚠️ Should always return 200
- ⚠️ Should show environment variable status

#### 4. `/api/convert-to-ppt` - PPT Download
**Test Cases:**
- ✅ Valid slides array
- ⚠️ Empty slides array
- ⚠️ Invalid slide structure
- ⚠️ Large slides array

### Error Scenarios

#### 1. Network Errors
- **Simulation**: Disconnect network mid-request
- **Expected**: Client should show user-friendly error
- **Logs**: Should show network error in client console

#### 2. Server Errors
- **Simulation**: Kill dyno during request
- **Expected**: 503 Service Unavailable
- **Logs**: Should show error in Heroku logs

#### 3. Timeout Errors
- **Simulation**: Very slow AI response (>30s)
- **Expected**: Request timeout, error message
- **Logs**: Should show duration in logs

#### 4. Invalid Data
- **Simulation**: Send malformed JSON
- **Expected**: 400 Bad Request
- **Logs**: Should show parse error

### Performance Tests

#### 1. Response Times
- **Target**: <5s for normal requests
- **Current**: ~21s for AI generation (acceptable for AI)
- **Monitor**: Track in logs with duration

#### 2. Concurrent Requests
- **Test**: 5 simultaneous requests
- **Expected**: All should complete successfully
- **Monitor**: Check for race conditions

#### 3. Memory Usage
- **Monitor**: Heroku dyno memory usage
- **Alert**: If >80% memory usage
- **Action**: Scale up if needed

### Stability Issues to Monitor

1. **Cold Starts**
   - First request after dyno sleep takes longer
   - Monitor: `connect` time in Heroku router logs
   - Current: ~9-16s connect time (normal for cold start)

2. **Tool Initialization**
   - Multiple toolkits loaded on each request
   - Monitor: Tool loading time in logs
   - Current: ~1.5s for all toolkits (acceptable)

3. **Error Handling**
   - All errors should be caught and logged
   - User should see friendly error messages
   - Logs should contain detailed error info

4. **Cookie Management**
   - userId cookie should be set correctly
   - Should persist across requests
   - Should work without authentication

## Automated Test Script

See `test-stability.sh` for automated tests.

## Monitoring Recommendations

1. **Set up Heroku Metrics**
   - Monitor response times
   - Monitor error rates
   - Monitor dyno memory/CPU

2. **Set up Alerts**
   - Alert on error rate >5%
   - Alert on response time >30s
   - Alert on memory usage >80%

3. **Log Analysis**
   - Track requestId through logs
   - Monitor for patterns in errors
   - Track user experience metrics

## Known Limitations

1. **Eco Dynos Sleep**
   - Dynos sleep after 30min inactivity
   - First request after sleep is slow (~10-15s)
   - Consider upgrading to Basic dyno for production

2. **Slug Size**
   - Current: 420MB (exceeds 300MB soft limit)
   - May affect boot time
   - Consider optimizing dependencies

3. **Composio SDK Version**
   - Using older version (0.1.35)
   - Should upgrade to 0.3.4
   - May require code changes

