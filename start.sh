#!/bin/bash

# Function to display a loading animation
function display_loading_animation {
    local sp='/-\|'
    printf ' '
    while true; do
        printf '\b%s' "$sp"
        sp=${sp#?}${sp%???}
        sleep 0.1
    done
}

# Function to stop the loading animation
function stop_loading_animation {
    kill "$1" 2>/dev/null
    wait "$1" 2>/dev/null
}

# Startup animation
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
display_loading_animation &
animation_pid=$!
docker build -f dockerfile.web -t gitsync_web . > /dev/null
stop_loading_animation "$animation_pid"
printf "Done!\n"

# Building the image for the engine with animation
printf "Building image for the engine... "
display_loading_animation &
animation_pid=$!
docker build -f dockerfile.engine -t gitsync_engine . > /dev/null
stop_loading_animation "$animation_pid"
printf "Done!\n"

# Starting services with animation
echo "Starting services..."
# docker-compose up -d > /dev/null
echo "Services started successfully!"

# End message with access link
echo "GitSync is ready to be used."
echo "Access at: http://localhost:9002"
