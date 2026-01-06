# Streaming Vercel Logs

## Quick Start

1. **Login to Vercel** (first time only):
   ```bash
   vercel login
   ```
   This will open a browser window for authentication.

2. **Link your project** (if not already linked):
   ```bash
   cd /Users/cristianpogan/Desktop/Business-Development/UpWork-Automations/ADunn/GenSpark
   vercel link
   ```
   Select your project: `open-genspark-474o`

3. **Stream logs in real-time**:
   ```bash
   ./stream-logs.sh
   ```
   
   Or directly:
   ```bash
   vercel logs open-genspark-474o --follow
   ```

## Alternative: Stream logs for specific deployment

```bash
# Get recent logs
vercel logs open-genspark-474o

# Follow logs in real-time
vercel logs open-genspark-474o --follow

# Filter by function
vercel logs open-genspark-474o --follow --output raw | grep "superagent"

# Filter by requestId
vercel logs open-genspark-474o --follow | grep "\[abc123\]"
```

## Filter Logs

### Filter by API route:
```bash
vercel logs open-genspark-474o --follow | grep "/api/superagent"
```

### Filter by error level:
```bash
vercel logs open-genspark-474o --follow | grep "❌"
```

### Filter by requestId (from error responses):
```bash
vercel logs open-genspark-474o --follow | grep "\[YOUR_REQUEST_ID\]"
```

### Show only errors:
```bash
vercel logs open-genspark-474o --follow | grep -E "(Error|error|❌|Failed)"
```

## View Logs in Browser

You can also view logs in the Vercel dashboard:
1. Go to https://vercel.com/cristian-pogans-projects/open-genspark-474o
2. Click on a deployment
3. Click "Runtime Logs" tab
4. Filter by function or search

## Useful Commands

```bash
# List all projects
vercel projects list

# Get project info
vercel inspect open-genspark-474o

# View deployment logs
vercel logs open-genspark-474o --since 1h

# Follow logs with timestamps
vercel logs open-genspark-474o --follow --output raw
```

## Troubleshooting

If you get authentication errors:
```bash
vercel logout
vercel login
```

If logs don't show up:
- Make sure the deployment is active
- Check that you're looking at the correct project
- Try filtering by function name: `--function api/superagent`

