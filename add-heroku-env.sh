#!/bin/bash

# Quick script to add environment variables to Heroku
# Usage: ./add-heroku-env.sh

APP_NAME="gen-spark"

echo "🔧 Adding environment variables to Heroku app: $APP_NAME"
echo ""

# Check if Heroku CLI is available
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed. Please install it first."
    exit 1
fi

# Check if logged in
if ! heroku auth:whoami &> /dev/null; then
    echo "❌ Not logged in to Heroku. Please run: heroku login"
    exit 1
fi

echo "📋 Current environment variables:"
heroku config -a $APP_NAME
echo ""

# Function to set config var
set_config() {
    local var_name=$1
    local var_value=$2
    
    if [ -z "$var_value" ]; then
        echo "⚠️  $var_name is empty. Skipping..."
        return 1
    fi
    
    echo "Setting $var_name..."
    heroku config:set "$var_name=$var_value" -a $APP_NAME
    return $?
}

# Get COMPOSIO_API_KEY
if [ -z "$COMPOSIO_API_KEY" ]; then
    echo "Enter COMPOSIO_API_KEY (or press Enter to skip):"
    read -s COMPOSIO_API_KEY
    echo ""
fi
if [ ! -z "$COMPOSIO_API_KEY" ]; then
    set_config "COMPOSIO_API_KEY" "$COMPOSIO_API_KEY"
fi

# Get GOOGLE_GENERATIVE_AI_API_KEY
if [ -z "$GOOGLE_GENERATIVE_AI_API_KEY" ]; then
    echo "Enter GOOGLE_GENERATIVE_AI_API_KEY (or press Enter to skip):"
    read -s GOOGLE_GENERATIVE_AI_API_KEY
    echo ""
fi
if [ ! -z "$GOOGLE_GENERATIVE_AI_API_KEY" ]; then
    set_config "GOOGLE_GENERATIVE_AI_API_KEY" "$GOOGLE_GENERATIVE_AI_API_KEY"
fi

# Set NODE_ENV
set_config "NODE_ENV" "production"

echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "📋 Updated configuration:"
heroku config -a $APP_NAME

