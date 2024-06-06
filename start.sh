#!/bin/bash

# Log file location
LOG_FILE="gitsync.log"

# Function to check if the app is running
is_running() {
    docker-compose ps | grep -q "Up"
}

# Function to display the menu
show_menu() {
    clear
    echo "GitSync Control Interface"
    echo "1. Start GitSync"
    echo "2. View Logs"
    echo "3. Stop GitSync"
    echo "4. Exit"
    read -p "Choose an option: " option
    case $option in
        1) start_gitsync ;;
        2) view_logs ;;
        3) stop_gitsync ;;
        4) exit 0 ;;
        *) echo "Invalid option" ;;
    esac
}

# Function to start GitSync
start_gitsync() {
    if is_running; then
        echo "GitSync is already running."
    else
        echo "Starting GitSync..."
        ./start.sh | tee -a $LOG_FILE &
        echo "GitSync started."
    fi
    sleep 2
    show_menu
}

# Function to view logs
view_logs() {
    if [ -f $LOG_FILE ]; then
        tail -f $LOG_FILE
    else
        echo "Log file not found."
    fi
    show_menu
}

# Function to stop GitSync
stop_gitsync() {
    echo "Stopping GitSync..."
    docker-compose down
    pkill -f "python3 gitsync.py"
    echo "GitSync stopped."
    sleep 2
    show_menu
}

# Main script starts here
clear
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
echo -n "Installing GitSync engine dependencies..."
echo " "
pip3 install -r scripts/requirements.txt > /dev/null
echo "Done!"

# Build the Docker image for the web service
echo -n "Building Docker image for the web service... "
echo " "
docker build -f dockerfile.web -t gitsync_web . > /dev/null
echo "Done!"

# Start the menu
show_menu
