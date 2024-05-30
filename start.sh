#!/bin/bash

# Startup
echo "Welcome! Launching GitSync..."

# Check if the 'data' directory exists
if [[ ! -d "data" ]]; then
    mkdir data
fi

# Check the presence of the token.json file
if [[ ! -f "data/token.json" ]]; then
    echo '{"token":""}' > data/token.json
fi

# Check the presence of the repos.json file
if [[ ! -f "data/repos.json" ]]; then
    echo '{"repos":[]}' > data/repos.json
fi

# Check for the presence of Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed."
    exit 1
fi

# Building the image for the web service with animation
printf "Building image for the web service... "
docker build -f dockerfile.web -t gitsync_web . > /dev/null
printf "Done!\n"

# Building the image for the engine with animation
printf "Building image for the engine... "
docker build -f dockerfile.engine -t gitsync_engine . > /dev/null
printf "Done!\n"

# Starting services with animation
echo "Starting services..."
docker-compose up -d > /dev/null
echo "Services started successfully!"

# End message with access link
echo "GitSync is ready to be used."
echo "Access at: http://localhost:9002"