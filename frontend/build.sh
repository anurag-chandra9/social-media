#!/bin/bash
echo "Starting frontend build process..."
npm install
echo "Dependencies installed, starting build..."
./node_modules/.bin/vite build
echo "Build completed!" 