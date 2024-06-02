#!/bin/bash

# Welcome message
echo "Welcome! Launching GitSync..."

# Ensure 'data' directory exists
if [[ ! -d "data" ]]; then
    mkdir data
fi

# Ensure required files exist in the 'data' directory
for file in token.json repos.json config.json; do
    if [[ ! -f "data/$file" ]]; then
        case $file in
            token.json) echo '{"token":""}' > "data/$file" ;;
            repos.json) echo '{"repos":[]}' > "data/$file" ;;
            config.json) echo '{"scanpath":""}' > "data/$file" ;;
        esac
    fi
done

# Check for the presence of required commands
for cmd in docker docker-compose python3 pip3; do
    if ! command -v $cmd &> /dev/null; then
        echo "Error: $cmd is not installed."
        exit 1
    fi
done

# Install GitSync engine dependencies
echo -n "Installing GitSync engine dependencies... "
pip3 install -r scripts/requirements.txt > /dev/null
echo "Done!"

# Build the Docker image for the web service
echo -n "Building Docker image for the web service... "
docker build -f dockerfile.web -t gitsync_web . > /dev/null
echo "Done!"

# Function to tail logs of docker-compose
tail_docker_logs() {
    docker-compose logs -f &
    docker_compose_pid=$!
}

# Function to stop services and script
cleanup() {
    echo "Stopping services..."
    docker-compose down
    [[ -n "$python_pid" ]] && kill $python_pid
    [[ -n "$docker_compose_pid" ]] && kill $docker_compose_pid
    echo "Services stopped. Exiting."
    exit 0
}

# Set up trap for SIGINT
trap cleanup SIGINT

# Start services and capture their logs
echo "Starting services..."
docker-compose up -d
tail_docker_logs

# Run the Python script
cd scripts && python3 gitsync.py &
python_pid=$!

# Wait for both background processes to complete
wait $python_pid $docker_compose_pid

# End message with access link
echo "GitSync is ready to be used."
echo "Access at: http://localhost:9002"
