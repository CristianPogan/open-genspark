# Heroku Deployment - Quick Start

## ✅ Setup Complete!

All required files have been created for Heroku deployment:

1. ✅ **Procfile** - Tells Heroku how to run your app
2. ✅ **package.json** - Updated with `heroku-postbuild` script
3. ✅ **next.config.ts** - Configured with `output: 'standalone'` for Heroku
4. ✅ **Heroku remote** - Already configured: `heroku git:remote -a gen-spark`

## 🚀 Quick Deployment Steps

### Step 1: Add Environment Variables

You have two options:

**Option A: Use the interactive script**
```bash
./add-heroku-env.sh
```

**Option B: Manual setup (if you have the keys)**
```bash
# From Vercel dashboard, copy your environment variables, then:
heroku config:set COMPOSIO_API_KEY="your-key-here" -a gen-spark
heroku config:set GOOGLE_GENERATIVE_AI_API_KEY="your-key-here" -a gen-spark
heroku config:set NODE_ENV=production -a gen-spark
```

**Option C: Get from Vercel (if you have Vercel CLI)**
```bash
# Pull env vars from Vercel (creates .env file)
vercel env pull .env.local

# Then set them on Heroku
export COMPOSIO_API_KEY=$(grep COMPOSIO_API_KEY .env.local | cut -d '=' -f2)
export GOOGLE_GENERATIVE_AI_API_KEY=$(grep GOOGLE_GENERATIVE_AI_API_KEY .env.local | cut -d '=' -f2)

heroku config:set COMPOSIO_API_KEY="$COMPOSIO_API_KEY" -a gen-spark
heroku config:set GOOGLE_GENERATIVE_AI_API_KEY="$GOOGLE_GENERATIVE_AI_API_KEY" -a gen-spark
heroku config:set NODE_ENV=production -a gen-spark
```

### Step 2: Deploy

```bash
# Commit all changes
git add -A
git commit -m "Add Heroku deployment configuration"

# Push to Heroku
git push heroku main
```

### Step 3: Verify

```bash
# Check app status
heroku ps -a gen-spark

# View logs
heroku logs --tail -a gen-spark

# Open app
heroku open -a gen-spark
```

## 📋 Required Environment Variables

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `COMPOSIO_API_KEY` | Composio API key | Vercel Dashboard → Settings → Environment Variables |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API key | Vercel Dashboard → Settings → Environment Variables |
| `NODE_ENV` | Set to `production` | Automatically set by Heroku |

## 🔍 Verify Configuration

```bash
# Check all config vars
heroku config -a gen-spark

# Should show:
# COMPOSIO_API_KEY:            set
# GOOGLE_GENERATIVE_AI_API_KEY: set
# NODE_ENV:                    production
```

## 📝 Files Created

- `Procfile` - Heroku process file
- `deploy-heroku.sh` - Full deployment script with env var setup
- `add-heroku-env.sh` - Quick script to add environment variables
- `.heroku-setup.md` - Detailed setup guide
- `HEROKU_DEPLOYMENT.md` - This file

## 🐛 Troubleshooting

### Build fails
```bash
heroku logs --tail -a gen-spark
```

### Missing environment variables
```bash
heroku config -a gen-spark
# Add missing vars:
heroku config:set VARIABLE_NAME="value" -a gen-spark
```

### App crashes on startup
- Check logs: `heroku logs --tail -a gen-spark`
- Verify all env vars are set correctly
- Ensure Node.js version is compatible (Heroku uses Node 20.x)

## 📚 Additional Resources

- [Heroku Next.js Guide](https://devcenter.heroku.com/articles/deploying-nextjs-apps)
- [Heroku Config Vars](https://devcenter.heroku.com/articles/config-vars)
- [Heroku CLI Reference](https://devcenter.heroku.com/articles/heroku-cli-commands)

