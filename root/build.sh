#!/bin/bash
  set -e

  echo "Building frontend..."
  cd frontend
  npm ci
  npm run build
  cd ..

  echo "Building backend..."
  cd backend
  npm ci
  npm run build
  cd ..

  echo "Build complete."