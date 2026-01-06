#!/bin/bash

# Stability Tests for GenSpark Application
# Run this script to test various scenarios

APP_URL="${HEROKU_APP_URL:-https://gen-spark-e33efe0eb64d.herokuapp.com}"
TEST_COUNT=0
PASS_COUNT=0
FAIL_COUNT=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    
    TEST_COUNT=$((TEST_COUNT + 1))
    echo -e "\n${YELLOW}Test $TEST_COUNT: $name${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$APP_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$APP_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} - Status: $http_code"
        PASS_COUNT=$((PASS_COUNT + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} - Expected: $expected_status, Got: $http_code"
        echo "Response: $body"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi
}

echo "=========================================="
echo "GenSpark Stability Tests"
echo "=========================================="
echo "App URL: $APP_URL"
echo ""

# Test 1: Health Check
test_endpoint "Health Check" "GET" "/api/health" "" "200"

# Test 2: SuperAgent - Empty Prompt (should fail)
test_endpoint "SuperAgent - Empty Prompt" "POST" "/api/superagent" \
    '{"prompt":""}' "400"

# Test 3: SuperAgent - Valid Prompt
test_endpoint "SuperAgent - Valid Prompt" "POST" "/api/superagent" \
    '{"prompt":"Hello, test message","selectedTool":"general","conversationHistory":[]}' "200"

# Test 4: Create Google Slides - Empty Slides (should fail)
test_endpoint "Create Google Slides - Empty Slides" "POST" "/api/create-google-slides" \
    '{"slides":[],"title":"Test"}' "400"

# Test 5: Create Google Slides - Valid Slides (may fail if not connected)
test_endpoint "Create Google Slides - Valid Slides" "POST" "/api/create-google-slides" \
    '{"slides":[{"title":"Test Slide","content":"Test content","type":"title"}],"title":"Test Presentation"}' \
    "200|401|500"

# Test 6: Convert to PPT - Empty Slides (should fail)
test_endpoint "Convert to PPT - Empty Slides" "POST" "/api/convert-to-ppt" \
    '{"slides":[]}' "400"

# Test 7: Convert to PPT - Valid Slides
test_endpoint "Convert to PPT - Valid Slides" "POST" "/api/convert-to-ppt" \
    '{"slides":[{"title":"Test Slide","content":"Test content","type":"title"}]}' "200"

# Test 8: Invalid JSON (should fail)
test_endpoint "Invalid JSON" "POST" "/api/superagent" \
    '{"prompt":"test"' "400"

# Test 9: Very Long Prompt
long_prompt=$(printf 'a%.0s' {1..5000})
test_endpoint "Very Long Prompt" "POST" "/api/superagent" \
    "{\"prompt\":\"$long_prompt\",\"selectedTool\":\"general\",\"conversationHistory\":[]}" "200|400|500"

# Test 10: Special Characters
test_endpoint "Special Characters" "POST" "/api/superagent" \
    '{"prompt":"Test: <>&\"'\''","selectedTool":"general","conversationHistory":[]}' "200|400"

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Total Tests: $TEST_COUNT"
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Check the output above.${NC}"
    exit 1
fi

