# GitSync

GitSync is a comprehensive tool designed to automate the synchronization of multiple Git repositories. It provides a robust solution for periodically updating repositories based on various triggers, such as new commits, specific commit patterns, or regular intervals. GitSync also includes a web interface for managing repositories, updating configuration parameters, and viewing repository details.

## Features

- **Automatic Repository Updates**: 
  - Update repositories periodically based on a specified interval.
  - Update repositories when new commits are pushed.
  - Update repositories based on specific commit message patterns.
  - Run custom commands after updating repositories.

- **Web Interface**: 
  - View and manage repositories.
  - Change repository parameters.
  - Add new repositories.
  - Delete repositories.
  - Update GitHub access tokens.
  - Repositories graphics

- **Logging**: 
  - Detailed logging of update actions.
  - Separate logs for informational messages, errors, and actions.

## Prerequisites

- Docker and Docker Compose installed on your system.
- GitHub access token with appropriate permissions.

## Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/gitsync.git
cd gitsync
```

### Step 3: Start the Docker Containers

Run the following command to start the containers:

```bash
docker-compose up
```

This will start the `web` service (React frontend and Node.js backend) and the `gitsync` service (Python script for syncing repositories).

### Step 4: Access the Web Interface

Open your browser and go to `http://localhost:9002` to access the GitSync web interface.

## Usage

### Web Interface

1. **View Repositories**:
   - See a list of all configured repositories.
   - Click on a repository to view its details and branches.

2. **Update Repository Parameters**:
   - Modify branch, update interval, update on new push, update on commit pattern, and run command.
   - Save changes to apply the new configuration.

3. **Add New Repository**:
   - Use the "Add New Repository" form to configure a new repository.

4. **Delete Repository**:
   - Remove a repository from the configuration.

5. **Update GitHub Token**:
   - Change the GitHub access token if needed.

### Logging

- **Info Log**: `/gitsync/data/info.log`
- **Error Log**: `/gitsync/data/error.log`
- **Action Log**: `/gitsync/data/action.log`

These logs provide detailed information about the synchronization process, including any errors that occur.


## Contact

For any questions or issues, please open an issue on the [GitHub repository](https://github.com/bubu57/gitsync).