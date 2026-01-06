#!/bin/bash

# Integration tests for API endpoints
# Tests that presentations work without Google Drive

APP_URL="${HEROKU_APP_URL:-https://gen-spark-e33efe0eb64d.herokuapp.com}"

echo "=========================================="
echo "API Integration Tests"
echo "=========================================="
echo "App URL: $APP_URL"
echo ""

PASS_COUNT=0
FAIL_COUNT=0

# Test 1: Create presentation without Google Drive
echo "Test 1: Create presentation (no Google Drive)"
echo "----------------------------------------"
response=$(curl -s -w "\n%{http_code}" --max-time 30 -X POST \
    -H "Content-Type: application/json" \
    -d '{"prompt":"Create a 3-slide presentation about AI","selectedTool":"general","conversationHistory":[]}' \
    "$APP_URL/api/superagent" 2>&1)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    if echo "$body" | grep -qi "google drive\|sign in\|connect"; then
        echo -e "\033[0;31m✗ FAIL\033[0m - Response mentions Google Drive or sign in"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    else
        echo -e "\033[0;32m✓ PASS\033[0m - Presentation created without Google Drive requirement"
        PASS_COUNT=$((PASS_COUNT + 1))
    fi
else
    echo -e "\033[0;31m✗ FAIL\033[0m - Status: $http_code"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 2: Download PPT works
echo "Test 2: Download PPT endpoint"
echo "----------------------------------------"
response=$(curl -s -w "\n%{http_code}" --max-time 30 -X POST \
    -H "Content-Type: application/json" \
    -d '{"slides":[{"title":"Test","content":"Content","type":"title"}],"title":"Test","style":"professional"}' \
    "$APP_URL/api/convert-to-ppt" 2>&1)
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ]; then
    echo -e "\033[0;32m✓ PASS\033[0m - PPT download works"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "\033[0;31m✗ FAIL\033[0m - Status: $http_code"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 3: Health check
echo "Test 3: Health check"
echo "----------------------------------------"
response=$(curl -s -w "\n%{http_code}" --max-time 10 "$APP_URL/api/health" 2>&1)
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ]; then
    echo -e "\033[0;32m✓ PASS\033[0m - Health check passed"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "\033[0;31m✗ FAIL\033[0m - Status: $http_code"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "\033[0;32mPassed: ${PASS_COUNT}\033[0m"
echo -e "\033[0;31mFailed: ${FAIL_COUNT}\033[0m"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "\033[0;32m✅ All integration tests passed!\033[0m"
    exit 0
else
    echo -e "\033[0;31m❌ Some tests failed\033[0m"
    exit 1
fi

