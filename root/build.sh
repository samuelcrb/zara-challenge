#!/bin/bash
  set -e

  echo "Checking frontend..."
  cd frontend
  npm ci
  npm run lint
  npm run type-check
  npm run build
  cd ..

  echo "Checking backend..."
  cd backend
  npm ci
  npm run type-check
  npm run build
  cd ..

  echo "Build complete."