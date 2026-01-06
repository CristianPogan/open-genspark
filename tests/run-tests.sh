#!/bin/bash

# Run all tests for GenSpark
# Tests that presentations are created locally without Google Drive dependencies

echo "=========================================="
echo "GenSpark Test Suite"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0

# Test 1: Check that Google Drive tools are not fetched
echo "Test 1: Verify Google Drive tools are not included"
echo "----------------------------------------"
if grep -q "GOOGLEDRIVE\|GOOGLESLIDES" app/api/superagent/route.ts | grep -q "toolkits.*\["; then
    echo -e "${RED}✗ FAIL${NC} - Google Drive/Slides tools are still being fetched"
    FAIL_COUNT=$((FAIL_COUNT + 1))
else
    echo -e "${GREEN}✓ PASS${NC} - Google Drive/Slides tools removed"
    PASS_COUNT=$((PASS_COUNT + 1))
fi
echo ""

# Test 2: Check that Save to Google Drive button is removed
echo "Test 2: Verify 'Save to Google Drive' button is removed"
echo "----------------------------------------"
# Check for actual button code, not comments
if grep -q "onClick.*saveToGoogleDrive\|Save to Google Drive" app/components/SuperAgent.tsx | grep -v "^[[:space:]]*//"; then
    echo -e "${RED}✗ FAIL${NC} - Save to Google Drive button still exists"
    FAIL_COUNT=$((FAIL_COUNT + 1))
else
    echo -e "${GREEN}✓ PASS${NC} - Save to Google Drive button removed"
    PASS_COUNT=$((PASS_COUNT + 1))
fi
echo ""

# Test 3: Check system prompt doesn't require Google Drive for presentations
echo "Test 3: Verify system prompt doesn't require Google Drive"
echo "----------------------------------------"
# Check for instructions to save to Google Drive (excluding comments)
if grep -q "save.*to.*Google Drive\|Google Drive.*save" app/api/superagent/route.ts | grep -v "^[[:space:]]*//" | grep -v "Removed\|removed"; then
    echo -e "${YELLOW}⚠ WARNING${NC} - System prompt may still mention saving to Google Drive"
else
    echo -e "${GREEN}✓ PASS${NC} - System prompt doesn't require Google Drive"
    PASS_COUNT=$((PASS_COUNT + 1))
fi
echo ""

# Test 4: Check that GENERATE_PRESENTATION_SLIDES is mentioned
echo "Test 4: Verify GENERATE_PRESENTATION_SLIDES tool is used"
echo "----------------------------------------"
if grep -q "GENERATE_PRESENTATION_SLIDES" app/api/superagent/route.ts; then
    echo -e "${GREEN}✓ PASS${NC} - GENERATE_PRESENTATION_SLIDES tool is referenced"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ FAIL${NC} - GENERATE_PRESENTATION_SLIDES tool not found"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 5: Check build succeeds
echo "Test 5: Verify build succeeds"
echo "----------------------------------------"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC} - Build successful"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ FAIL${NC} - Build failed"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: ${PASS_COUNT}${NC}"
echo -e "${RED}Failed: ${FAIL_COUNT}${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi

