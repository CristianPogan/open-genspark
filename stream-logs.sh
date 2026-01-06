#!/bin/bash

# Stream Vercel logs for open-genspark-474o project
# Usage: ./stream-logs.sh

echo "🔍 Streaming Vercel logs..."
echo "Press Ctrl+C to stop"
echo ""
echo "Filter options:"
echo "  - Errors only: ./stream-logs.sh | grep -E '(❌|Error|error|Failed)'"
echo "  - SuperAgent only: ./stream-logs.sh | grep '/api/superagent'"
echo "  - By requestId: ./stream-logs.sh | grep '\[YOUR_REQUEST_ID\]'"
echo ""

# Stream logs for the current project (linked via .vercel)
cd "$(dirname "$0")"
vercel logs --follow
