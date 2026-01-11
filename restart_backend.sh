#!/bin/bash
pkill -f "node server.js" || true
cd backend
node server.js > ../logs/backend.log 2>&1 &
