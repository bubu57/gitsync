import os
import json
import time
import logging
import requests
from threading import Thread
from git import Repo
import subprocess

# Configuration du logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def load_repos(file_path):
    """Charge la configuration des dépôts depuis un fichier JSON."""
    with open(file_path, 'r') as file:
        return json.load(file)

def save_repos(file_path, data):
    """Sauvegarde la configuration des dépôts dans un fichier JSON."""
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)

def load_token(token_file_path):
    """Charge le token GitHub depuis un fichier JSON."""
    with open(token_file_path, 'r') as file:
        token_data = json.load(file)
        return token_data['token']

def update_repo(repo_info):
    """Met à jour le dépôt local avec les dernières modifications du dépôt distant."""
    repo_path = "/user_sys/" + repo_info['path']
    branch = repo_info['branch']
    repo = Repo(repo_path)
    
    logging.info(f"Fetching updates for repo {repo_info['name']} on branch {branch}")
    repo.remotes.origin.fetch()  # Récupération des derniers changements
    local_commit = repo.commit(branch)
    remote_commit = repo.remotes.origin.refs[branch].commit

    if local_commit != remote_commit:
        logging.info(f"Updating repo {repo_info['name']} on branch {branch}")
        repo.git.checkout(branch)
        repo.remotes.origin.pull()

        # Exécuter la commande spécifiée après le pull, si présente
        if 'runCmd' in repo_info and repo_info['runCmd'].strip():
            cmd = repo_info['runCmd']
            logging.info(f"Running command for repo {repo_info['name']}: {cmd}")
            try:
                result = subprocess.run(cmd, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                logging.info(f"Command output: {result.stdout.decode()}")
                logging.error(f"Command error output: {result.stderr.decode()}")
            except subprocess.CalledProcessError as e:
                logging.error(f"Error running command for repo {repo_info['name']}: {e}")

def check_new_push(repo_info):
    """Vérifie s'il y a un nouveau push dans le dépôt distant."""
    repo_path = "/user_sys/" + repo_info['path']
    branch = repo_info['branch']
    repo = Repo(repo_path)
    
    logging.info(f"Checking new push for repo {repo_info['name']} on branch {branch}")
    repo.remotes.origin.fetch()
    local_commit = repo.commit(branch)
    remote_commit = repo.remotes.origin.refs[branch].commit

    return local_commit != remote_commit

def check_commit_pattern(repo_info, pattern):
    """Vérifie si le dernier commit contient un certain pattern dans le message."""
    repo_path = "/user_sys/" + repo_info['path']
    branch = repo_info['branch']
    repo = Repo(repo_path)
    
    commits = list(repo.iter_commits(branch, max_count=1))
    if commits and pattern in commits[0].message:
        logging.info(f"Commit pattern found for repo {repo_info['name']} on branch {branch}")
        return True
    return False

def get_latest_commit_sha(owner, repo_name, branch, token):
    """Récupère le SHA du dernier commit du dépôt distant."""
    url = f"https://api.github.com/repos/{owner}/{repo_name}/commits/{branch}"
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": f"token {token}"
    }
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json()
        return data['sha']
    else:
        logging.error(f"Error fetching latest SHA for repo {repo_name}")
        return None

def handle_uint_updates(repo_info):
    """Met à jour le dépôt périodiquement selon l'intervalle spécifié."""
    interval = int(repo_info['UInt'])
    while True:
        logging.info(f"Scheduled update for repo {repo_info['name']}")
        update_repo(repo_info)
        time.sleep(interval * 60)

def main():
    """Fonction principale qui orchestre la mise à jour des dépôts."""
    file_path = '/gitsync/data/repos.json'
    token_file_path = '/gitsync/data/token.json'
    token = load_token(token_file_path)
    interval_threads = []

    while True:
        repos_data = load_repos(file_path)
        repos = repos_data['repos']

        for repo_info in repos:
            parameters_count = 0
            update_needed = False

            # Mise à jour périodique
            if repo_info.get('UInt') and repo_info['UInt'].strip():
                parameters_count += 1
                if repo_info['UInt'] not in [thread.name for thread in interval_threads]:
                    thread = Thread(target=handle_uint_updates, args=(repo_info,), name=repo_info['UInt'])
                    thread.daemon = True
                    thread.start()
                    interval_threads.append(thread)
                update_needed = True

            # Mise à jour sur nouveau push
            if repo_info.get('UlastPush'):
                parameters_count += 1
                if check_new_push(repo_info):
                    update_repo(repo_info)
                    update_needed = True
            
            # Mise à jour sur pattern de commit
            if repo_info.get('UpatCom'):
                parameters_count += 1
                pattern = repo_info['UpatCom']
                latest_commit_sha = Repo("/user_sys/" + repo_info['path']).commit(repo_info['branch']).hexsha
                latest_api_commit_sha = get_latest_commit_sha(repo_info['owner'], repo_info['name'], repo_info['branch'], token)
                if latest_api_commit_sha and latest_commit_sha != latest_api_commit_sha:
                    if check_commit_pattern(repo_info, pattern):
                        update_repo(repo_info)
                        update_needed = True

                repo_info['lastCommitSha'] = latest_commit_sha

            # Mettre à jour le dernier SHA de commit si nécessaire
            if update_needed:
                repo = Repo("/user_sys/" + repo_info['path'])
                latest_commit_sha = repo.commit(repo_info['branch']).hexsha
                if repo_info['lastCommitSha'] != latest_commit_sha:
                    repo_info['lastCommitSha'] = latest_commit_sha

            logging.info(f"{repo_info.get('name')} - Parameters: {parameters_count}")

        save_repos(file_path, repos_data)

        time.sleep(5)

if __name__ == "__main__":
    main()