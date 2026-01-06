#!/bin/bash

# Test Google Slides functionality

APP_URL="${HEROKU_APP_URL:-https://gen-spark-e33efe0eb64d.herokuapp.com}"

echo "=========================================="
echo "Google Slides Integration Tests"
echo "=========================================="
echo ""

# Test 1: Check if Google Slides tools are available
echo "Test 1: Check Google Slides Tools Availability"
echo "----------------------------------------"
response=$(curl -s -w "\n%{http_code}" --max-time 30 -X POST \
    -H "Content-Type: application/json" \
    -d '{"prompt":"What Google Slides tools are available?","selectedTool":"general","conversationHistory":[]}' \
    "$APP_URL/api/superagent" 2>&1)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "Status: $http_code"
if [ "$http_code" = "200" ]; then
    echo "✅ Request successful"
    if echo "$body" | grep -qi "GOOGLESLIDES\|Google Slides\|presentation"; then
        echo "✅ Response mentions Google Slides"
    fi
else
    echo "❌ Request failed"
fi
echo ""

# Test 2: Test Google Slides creation request (will fail without account, but should handle gracefully)
echo "Test 2: Google Slides Creation Request"
echo "----------------------------------------"
response=$(curl -s -w "\n%{http_code}" --max-time 35 -X POST \
    -H "Content-Type: application/json" \
    -d '{"prompt":"Create a Google Slides presentation about AI","selectedTool":"slides","conversationHistory":[]}' \
    "$APP_URL/api/superagent" 2>&1)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "Status: $http_code"
if [ "$http_code" = "200" ]; then
    if echo "$body" | grep -qi "signin\|connect\|account"; then
        echo "✅ Returns helpful message about connecting account"
    elif echo "$body" | grep -qi "Google Slides\|presentation"; then
        echo "✅ AI responds about Google Slides"
    else
        echo "⚠️  Response doesn't mention connection or Google Slides"
    fi
else
    echo "❌ Request failed with status $http_code"
fi
echo ""

# Test 3: Test timeout handling (should wait for response)
echo "Test 3: Timeout Handling Test"
echo "----------------------------------------"
start_time=$(date +%s)
response=$(curl -s -w "\n%{http_code}" --max-time 35 -X POST \
    -H "Content-Type: application/json" \
    -d '{"prompt":"Create a comprehensive presentation about artificial intelligence with multiple sections","selectedTool":"general","conversationHistory":[]}' \
    "$APP_URL/api/superagent" 2>&1)
duration=$(($(date +%s) - start_time))
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "Duration: ${duration}s"
echo "Status: $http_code"

if [ "$duration" -lt 30 ]; then
    echo "✅ Request completed before 30s timeout"
    if [ "$http_code" = "200" ]; then
        if echo "$body" | grep -qi "timeout\|longer\|simpler"; then
            echo "⚠️  Response contains timeout message (unexpected - should wait for completion)"
        else
            echo "✅ Got actual response (no timeout error)"
        fi
    fi
else
    echo "❌ Request exceeded 30s"
fi
echo ""

# Test 4: Test create-google-slides endpoint
echo "Test 4: Create Google Slides Endpoint"
echo "----------------------------------------"
response=$(curl -s -w "\n%{http_code}" --max-time 30 -X POST \
    -H "Content-Type: application/json" \
    -d '{"title":"Test Presentation","slides":[{"title":"Slide 1","content":"Test content","type":"content"}]}' \
    "$APP_URL/api/create-google-slides" 2>&1)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "Status: $http_code"
if [ "$http_code" = "401" ]; then
    if echo "$body" | grep -qi "not connected\|signin\|connect"; then
        echo "✅ Returns helpful 401 error about connecting account"
    else
        echo "⚠️  401 but message not helpful"
    fi
elif [ "$http_code" = "200" ]; then
    if echo "$body" | grep -qi "success\|presentationId\|slidesUrl"; then
        echo "✅ Successfully created Google Slides"
    fi
else
    echo "⚠️  Unexpected status: $http_code"
    echo "Response: $(echo "$body" | head -c 200)"
fi
echo ""

echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Tests completed. Review results above."

