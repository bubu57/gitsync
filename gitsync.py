import os
import json
import time
import logging
from datetime import datetime
from git import Repo, remote

# Configuration du logging
log_format = '%(asctime)s - %(levelname)s - %(message)s'
logging.basicConfig(level=logging.INFO, format=log_format)

# Create handlers
file_handler = logging.FileHandler('data/action.log')
console_handler = logging.StreamHandler()

# Set level for handlers
file_handler.setLevel(logging.INFO)
console_handler.setLevel(logging.INFO)

# Create formatters and add them to the handlers
formatter = logging.Formatter(log_format)
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# Add handlers to the logger
logger = logging.getLogger()
logger.addHandler(file_handler)
logger.addHandler(console_handler)

def load_repos(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)['repos']

def update_repo(repo_info):
    path = repo_info['path']
    branch = repo_info['branch']
    repo = Repo(path)
    
    # Fetch latest changes
    repo.remotes.origin.fetch()
    
    # Check if the branch is up-to-date
    local_commit = repo.commit(branch)
    remote_commit = repo.remotes.origin.refs[branch].commit

    if local_commit != remote_commit:
        logger.info(f"Updating repo {repo_info['name']} on branch {branch}")
        repo.git.checkout(branch)
        repo.remotes.origin.pull()

def check_new_push(repo_info):
    path = repo_info['path']
    branch = repo_info['branch']
    repo = Repo(path)
    
    repo.remotes.origin.fetch()
    local_commit = repo.commit(branch)
    remote_commit = repo.remotes.origin.refs[branch].commit

    return local_commit != remote_commit

def check_commit_pattern(repo_info, pattern):
    path = repo_info['path']
    branch = repo_info['branch']
    repo = Repo(path)
    
    commits = list(repo.iter_commits(branch, max_count=1))
    if commits and pattern in commits[0].message:
        return True
    return False

def main():
    parameters = 0
    
    while True:
        repos = load_repos('data/repos.json')

        for repo_info in repos:
            if repo_info.get('UInt'):
                parameters = parameters + 1
                logger.info(f"Scheduled update for repo {repo_info['name']} due to UInt parameter.")
                update_repo(repo_info)
                interval = int(repo_info['UInt'])
                time.sleep(interval * 60)

            if repo_info.get('UlastPush'):
                parameters = parameters + 1
                if check_new_push(repo_info):
                    logger.info(f"New push detected for repo {repo_info['name']}. Updating...")
                    update_repo(repo_info)
            
            if repo_info.get('UpatCom'):
                parameters = parameters + 1
                pattern = repo_info['UpatCom']
                if check_commit_pattern(repo_info, pattern):
                    logger.info(f"Commit pattern '{pattern}' found for repo {repo_info['name']}. Updating...")
                    update_repo(repo_info)

            print(repo_info.get('name'), parameters)
            parameters = 0
        
        time.sleep(5)  # Wait for 5 seconds before next check

if __name__ == "__main__":
    main()