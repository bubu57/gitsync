import os
import json
import time
import logging
import requests
from git import Repo
from threading import Thread

# Configuration du logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def load_repos(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

def save_repos(file_path, data):
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)

def update_repo(repo_info):
    repo_path = repo_info['path']
    branch = repo_info['branch']
    repo = Repo(repo_path)
    
    repo.remotes.origin.fetch()  # Récupération des derniers changements
    local_commit = repo.commit(branch)
    remote_commit = repo.remotes.origin.refs[branch].commit

    if local_commit != remote_commit:
        logging.info(f"Mise à jour du dépôt {repo_info['name']} sur la branche {branch}")
        repo.git.checkout(branch)
        repo.remotes.origin.pull()

def check_new_push(repo_info):
    repo_path = repo_info['path']
    branch = repo_info['branch']
    repo = Repo(repo_path)
    
    repo.remotes.origin.fetch()
    local_commit = repo.commit(branch)
    remote_commit = repo.remotes.origin.refs[branch].commit

    return local_commit != remote_commit

def check_commit_pattern(repo_info, pattern):
    repo_path = repo_info['path']
    branch = repo_info['branch']
    repo = Repo(repo_path)
    
    commits = list(repo.iter_commits(branch, max_count=1))
    if commits and pattern in commits[0].message:
        return True
    return False

def get_latest_commit_sha(owner, repo_name, branch):
    url = f"https://api.github.com/repos/{owner}/{repo_name}/commits/{branch}"
    headers = {"Accept": "application/vnd.github.v3+json"}
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json()
        return data['sha']
    else:
        logging.error(f"Erreur lors de la récupération du dernier SHA pour le dépôt {repo_name}")
        return None

def handle_uint_updates(repo_info):
    interval = int(repo_info['UInt'])
    while True:
        logging.info(f"Exécution de la mise à jour planifiée pour le dépôt {repo_info['name']}")
        update_repo(repo_info)
        time.sleep(interval * 60)

def main():
    file_path = 'data/repos.json'
    interval_threads = []

    while True:
        repos_data = load_repos(file_path)
        repos = repos_data['repos']

        for repo_info in repos:
            parameters_count = 0
            update_needed = False

            if repo_info.get('UInt') and repo_info['UInt'].strip():
                parameters_count += 1
                if repo_info['UInt'] not in [thread.name for thread in interval_threads]:
                    thread = Thread(target=handle_uint_updates, args=(repo_info,), name=repo_info['UInt'])
                    thread.daemon = True
                    thread.start()
                    interval_threads.append(thread)
                update_needed = True

            if repo_info.get('UlastPush'):
                parameters_count += 1
                if check_new_push(repo_info):
                    update_repo(repo_info)
                    update_needed = True
            
            if repo_info.get('UpatCom'):
                parameters_count += 1
                pattern = repo_info['UpatCom']
                latest_commit_sha = Repo(repo_info['path']).commit(repo_info['branch']).hexsha
                latest_api_commit_sha = get_latest_commit_sha(repo_info['owner'], repo_info['name'], repo_info['branch'])
                if latest_api_commit_sha and latest_commit_sha != latest_api_commit_sha:
                    if check_commit_pattern(repo_info, pattern):
                        update_repo(repo_info)
                        update_needed = True

                repo_info['lastCommitSha'] = latest_commit_sha

            if update_needed:
                repo = Repo(repo_info['path'])
                latest_commit_sha = repo.commit(repo_info['branch']).hexsha
                if repo_info['lastCommitSha'] != latest_commit_sha:
                    repo_info['lastCommitSha'] = latest_commit_sha

            logging.info(f"{repo_info.get('name')} - Paramètres : {parameters_count}")

        save_repos(file_path, repos_data)

        time.sleep(5)

if __name__ == "__main__":
    main()
