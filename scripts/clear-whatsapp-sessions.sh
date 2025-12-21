#!/bin/bash
# Script to clear WhatsApp sessions
# Use this if you're having connection issues

echo "🗑️  Clearing WhatsApp sessions..."
echo ""

if [ -d ".whatsapp-sessions" ]; then
  rm -rf .whatsapp-sessions
  echo "✅ WhatsApp sessions cleared"
else
  echo "ℹ️  No WhatsApp sessions found"
fi

echo ""
echo "💡 Tip: Wait 10-30 minutes before trying to connect again"
echo "   This helps avoid WhatsApp rate limiting"

