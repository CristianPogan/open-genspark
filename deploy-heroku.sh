#!/bin/bash

# Heroku Deployment Script for GenSpark
# This script sets up environment variables on Heroku

APP_NAME="gen-spark"

echo "🚀 Setting up Heroku environment variables for $APP_NAME..."

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed. Please install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "❌ Not logged in to Heroku. Please run: heroku login"
    exit 1
fi

# Set required environment variables
echo ""
echo "📝 Setting environment variables..."

# COMPOSIO_API_KEY
if [ -z "$COMPOSIO_API_KEY" ]; then
    echo "⚠️  COMPOSIO_API_KEY not found in local environment."
    read -p "Enter COMPOSIO_API_KEY (or press Enter to skip): " COMPOSIO_API_KEY
fi
if [ ! -z "$COMPOSIO_API_KEY" ]; then
    heroku config:set COMPOSIO_API_KEY="$COMPOSIO_API_KEY" -a $APP_NAME
    echo "✅ Set COMPOSIO_API_KEY"
else
    echo "⚠️  Skipping COMPOSIO_API_KEY"
fi

# GOOGLE_GENERATIVE_AI_API_KEY
if [ -z "$GOOGLE_GENERATIVE_AI_API_KEY" ]; then
    echo "⚠️  GOOGLE_GENERATIVE_AI_API_KEY not found in local environment."
    read -p "Enter GOOGLE_GENERATIVE_AI_API_KEY (or press Enter to skip): " GOOGLE_GENERATIVE_AI_API_KEY
fi
if [ ! -z "$GOOGLE_GENERATIVE_AI_API_KEY" ]; then
    heroku config:set GOOGLE_GENERATIVE_AI_API_KEY="$GOOGLE_GENERATIVE_AI_API_KEY" -a $APP_NAME
    echo "✅ Set GOOGLE_GENERATIVE_AI_API_KEY"
else
    echo "⚠️  Skipping GOOGLE_GENERATIVE_AI_API_KEY"
fi

# NODE_ENV is automatically set by Heroku, but we can ensure it's production
heroku config:set NODE_ENV=production -a $APP_NAME
echo "✅ Set NODE_ENV=production"

echo ""
echo "📋 Current Heroku config variables:"
heroku config -a $APP_NAME

echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Ensure your code is committed: git add -A && git commit -m 'Prepare for Heroku deployment'"
echo "   2. Add Heroku remote (if not already added):"
echo "      heroku git:remote -a $APP_NAME"
echo "   3. Deploy to Heroku:"
echo "      git push heroku main"
echo "   4. Open your app:"
echo "      heroku open -a $APP_NAME"

