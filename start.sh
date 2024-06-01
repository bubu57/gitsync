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

# Check the presence of the repos.json file
if [[ ! -f "data/config.json" ]]; then
    echo '{"scannpath":""}' > data/config.json
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

# Building the image for the web service
printf "Building image for the web service... "
docker build -f dockerfile.web -t gitsync_web . > /dev/null
printf "Done!\n"

# Function to tail logs of docker-compose
tail_docker_logs() {
    docker-compose logs -f &
    docker_compose_pid=$!
}

# Function to stop services and script
cleanup() {
    echo "Stopping services..."
    docker-compose down
    if [[ -n "$python_pid" ]]; then
        kill $python_pid
    fi
    if [[ -n "$docker_compose_pid" ]]; then
        kill $docker_compose_pid
    fi
    echo "Services stopped. Exiting."
    exit 0
}

# Set up trap for SIGINT
trap cleanup SIGINT

# Starting services and capturing their logs
echo "Starting services..."
docker-compose up -d
tail_docker_logs

# Running the Python script
cd scripts && python3 gitsync.py &
python_pid=$!

# Wait for both background processes to complete
wait $python_pid $docker_compose_pid

# End message with access link
echo "GitSync is ready to be used."
echo "Access at: http://localhost:9002"