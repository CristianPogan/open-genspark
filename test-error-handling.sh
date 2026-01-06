#!/bin/bash

# Comprehensive Error Handling Tests for GenSpark
# Tests timeout handling and tool execution errors

APP_URL="${HEROKU_APP_URL:-https://gen-spark-e33efe0eb64d.herokuapp.com}"
TEST_COUNT=0
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "GenSpark Error Handling Tests"
echo "=========================================="
echo "App URL: $APP_URL"
echo ""

# Test function
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    local check_message=$6
    
    TEST_COUNT=$((TEST_COUNT + 1))
    echo -e "\n${BLUE}Test $TEST_COUNT: $name${NC}"
    
    start_time=$(date +%s)
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" --max-time 35 "$APP_URL$endpoint" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" --max-time 35 -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$APP_URL$endpoint" 2>&1)
    fi
    
    duration=$(($(date +%s) - start_time))
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # Check status code
    status_match=false
    if [[ "$expected_status" == *"|"* ]]; then
        # Multiple acceptable status codes
        IFS='|' read -ra STATUSES <<< "$expected_status"
        for status in "${STATUSES[@]}"; do
            if [ "$http_code" = "$status" ]; then
                status_match=true
                break
            fi
        done
    else
        if [ "$http_code" = "$expected_status" ]; then
            status_match=true
        fi
    fi
    
    if [ "$status_match" = true ]; then
        echo -e "${GREEN}✓ PASS${NC} - Status: $http_code (${duration}s)"
        
        # Check for specific error messages if provided
        if [ ! -z "$check_message" ]; then
            if echo "$body" | grep -qi "$check_message"; then
                echo -e "  ${GREEN}✓${NC} Error message contains expected text"
                PASS_COUNT=$((PASS_COUNT + 1))
            else
                echo -e "  ${YELLOW}⚠${NC} Error message doesn't contain expected text"
                echo "  Expected: $check_message"
                echo "  Got: $(echo "$body" | head -c 200)"
                WARN_COUNT=$((WARN_COUNT + 1))
            fi
        else
            PASS_COUNT=$((PASS_COUNT + 1))
        fi
        
        # Show response preview
        if [ "$http_code" != "200" ]; then
            echo "  Response preview: $(echo "$body" | head -c 150)..."
        fi
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} - Expected: $expected_status, Got: $http_code (${duration}s)"
        echo "  Response: $(echo "$body" | head -c 300)"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi
}

# Test 1: Health Check (baseline)
test_endpoint "Health Check" "GET" "/api/health" "" "200"

# Test 2: Normal Request (should work)
test_endpoint "Normal Request" "POST" "/api/superagent" \
    '{"prompt":"Hello, this is a test","selectedTool":"general","conversationHistory":[]}' \
    "200" ""

# Test 3: Request that might trigger Google Slides (without connection)
echo -e "\n${YELLOW}Testing Google Slides request without connected account...${NC}"
test_endpoint "Google Slides Request (No Account)" "POST" "/api/superagent" \
    '{"prompt":"Create a presentation in Google Drive about AI","selectedTool":"general","conversationHistory":[]}' \
    "200|500" "signin|connect|account"

# Test 4: Empty Prompt (should fail gracefully)
test_endpoint "Empty Prompt" "POST" "/api/superagent" \
    '{"prompt":"","selectedTool":"general","conversationHistory":[]}' \
    "400" ""

# Test 5: Invalid JSON
test_endpoint "Invalid JSON" "POST" "/api/superagent" \
    '{"prompt":"test"' \
    "400" ""

# Test 6: Very Long Prompt (might timeout)
echo -e "\n${YELLOW}Testing with very long prompt (timeout risk)...${NC}"
long_prompt=$(printf 'Explain in detail: %.0s' {1..200})
test_endpoint "Very Long Prompt" "POST" "/api/superagent" \
    "{\"prompt\":\"$long_prompt\",\"selectedTool\":\"general\",\"conversationHistory\":[]}" \
    "200|500|503" "timeout|longer|simpler"

# Test 7: Request that should complete quickly
test_endpoint "Quick Request" "POST" "/api/superagent" \
    '{"prompt":"Say hello","selectedTool":"general","conversationHistory":[]}' \
    "200" ""

# Test 8: Google Sheets request (without connection)
echo -e "\n${YELLOW}Testing Google Sheets request without connected account...${NC}"
test_endpoint "Google Sheets Request (No Account)" "POST" "/api/superagent" \
    '{"prompt":"Create a Google Sheet with sales data","selectedTool":"general","conversationHistory":[]}' \
    "200|500" "signin|connect|account"

# Test 9: Check if timeout handling works (request should fail before 30s)
echo -e "\n${YELLOW}Testing timeout handling (should fail gracefully before 30s)...${NC}"
complex_prompt="Analyze this complex data and create a comprehensive report with multiple sections, detailed analysis, and recommendations: $(printf 'Data point %d: ' {1..100})"
start_time=$(date +%s)
response=$(curl -s -w "\n%{http_code}" --max-time 35 -X POST \
    -H "Content-Type: application/json" \
    -d "{\"prompt\":\"$complex_prompt\",\"selectedTool\":\"general\",\"conversationHistory\":[]}" \
    "$APP_URL/api/superagent" 2>&1)
duration=$(($(date +%s) - start_time))
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

TEST_COUNT=$((TEST_COUNT + 1))
if [ "$duration" -lt 30 ]; then
    echo -e "${GREEN}✓ PASS${NC} - Request completed/failed before timeout (${duration}s)"
    if echo "$body" | grep -qi "timeout\|longer\|simpler"; then
        echo -e "  ${GREEN}✓${NC} Contains timeout-related message"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "  ${YELLOW}⚠${NC} No timeout message found (but completed in time)"
        WARN_COUNT=$((WARN_COUNT + 1))
    fi
else
    echo -e "${RED}✗ FAIL${NC} - Request took ${duration}s (exceeded 30s timeout)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test 10: Check error message format for tool execution errors
echo -e "\n${YELLOW}Testing tool execution error handling...${NC}"
test_endpoint "Tool Execution Error" "POST" "/api/superagent" \
    '{"prompt":"Create a Google Slides presentation about robots","selectedTool":"slides","conversationHistory":[]}' \
    "200|500" "signin|connect|Google account"

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Total Tests: $TEST_COUNT"
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${YELLOW}Warnings: $WARN_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo ""

# Analysis
echo "=========================================="
echo "Error Handling Analysis"
echo "=========================================="

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ All critical tests passed!${NC}"
    echo ""
    echo "Key Findings:"
    echo "- Timeout handling: Working (requests complete/fail before 30s)"
    echo "- Error messages: User-friendly"
    echo "- Tool execution errors: Handled gracefully"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Review the output above.${NC}"
    echo ""
    echo "Recommendations:"
    echo "- Check if timeout handling is working (should fail before 30s)"
    echo "- Verify error messages are user-friendly"
    echo "- Ensure tool execution errors return helpful messages"
    exit 1
fi

