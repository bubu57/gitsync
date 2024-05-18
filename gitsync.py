import os
import json
import time
import logging
import requests
from git import Repo

# Configuration du logging
log_format = '%(asctime)s - %(levelname)s - %(message)s'
logging.basicConfig(level=logging.INFO, format=log_format)

# Création des gestionnaires de log
file_handler = logging.FileHandler('data/action.log')
console_handler = logging.StreamHandler()

# Définition du niveau de log pour les gestionnaires
file_handler.setLevel(logging.INFO)
console_handler.setLevel(logging.INFO)

# Création des formateurs et ajout à chaque gestionnaire
formatter = logging.Formatter(log_format)
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# Ajout des gestionnaires au logger
logger = logging.getLogger()
logger.addHandler(file_handler)
logger.addHandler(console_handler)

def load_repos(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

def save_repos(file_path, data):
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)

def update_repo(repo_info):
    path = repo_info['path']
    branch = repo_info['branch']
    repo = Repo(path)
    
    # Récupération des derniers changements
    repo.remotes.origin.fetch()
    
    # Vérification si la branche est à jour
    local_commit = repo.commit(branch)
    remote_commit = repo.remotes.origin.refs[branch].commit

    if local_commit != remote_commit:
        logger.info(f"Mise à jour du dépôt {repo_info['name']} sur la branche {branch}")
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

def get_latest_commit_sha(owner, repo_name, branch):
    url = f"https://api.github.com/repos/{owner}/{repo_name}/commits/{branch}"
    headers = {"Accept": "application/vnd.github.v3+json"}
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json()
        return data['sha']
    else:
        logger.error(f"Erreur lors de la récupération du dernier SHA pour le dépôt {repo_name}")
        return None

def main():
    file_path = 'data/repos.json'
    
    while True:
        data = load_repos(file_path)
        repos = data['repos']

        for repo_info in repos:
            parameters = 0
            update_needed = False

            if repo_info.get('UInt'):
                parameters += 1
                logger.info(f"Mise à jour planifiée pour le dépôt {repo_info['name']} en raison du paramètre UInt")
                update_repo(repo_info)
                interval = int(repo_info['UInt'])
                time.sleep(interval * 60)
                update_needed = True

            if repo_info.get('UlastPush'):
                parameters += 1
                if check_new_push(repo_info):
                    logger.info(f"Nouveau push détecté pour le dépôt {repo_info['name']}. Mise à jour en cours...")
                    update_repo(repo_info)
                    update_needed = True
            
            if repo_info.get('UpatCom'):
                parameters += 1
                pattern = repo_info['UpatCom']
                repo = Repo(repo_info['path'])
                repo.remotes.origin.fetch()  # Assurer que nous récupérons les derniers changements
                latest_commit_sha = repo.commit(repo_info['branch']).hexsha
                latest_api_commit_sha = get_latest_commit_sha(repo_info['owner'], repo_info['name'], repo_info['branch'])
                if latest_api_commit_sha and latest_commit_sha != latest_api_commit_sha:
                    if check_commit_pattern(repo_info, pattern):
                        logger.info(f"Pattern de commit '{pattern}' trouvé pour le dépôt {repo_info['name']}. Mise à jour en cours...")
                        update_repo(repo_info)
                        update_needed = True
                    
                # Mettre à jour le SHA du dernier commit dans le fichier JSON
                repo_info['lastCommitSha'] = latest_commit_sha

            print(repo_info.get('name'), parameters)

        # Sauvegarde des informations de dépôt mises à jour dans le fichier JSON
        if update_needed:
            save_repos(file_path, data)

        time.sleep(5)  # Attente de 5 secondes avant la prochaine vérification

if __name__ == "__main__":
    main()
