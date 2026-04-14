#!/bin/bash
echo "Starting Ticketer..."

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "Error: Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..." 
  npm install
fi

# Start the server
echo "Starting the server..."
npm start
