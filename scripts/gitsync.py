import os
import json
import time
import logging
import requests
from threading import Thread
from git import Repo
import subprocess

# Création des répertoires de logs si nécessaires
os.makedirs('/gitsync/data', exist_ok=True)

# Configuration des gestionnaires de logs
logging.basicConfig(level=logging.INFO)

# Gestionnaire de log info
info_handler = logging.FileHandler('/gitsync/data/info.log')
info_handler.setLevel(logging.INFO)
info_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
info_handler.setFormatter(info_formatter)

# Gestionnaire de log error
error_handler = logging.FileHandler('/gitsync/data/error.log')
error_handler.setLevel(logging.ERROR)
error_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
error_handler.setFormatter(error_formatter)

# Gestionnaire de log action
action_handler = logging.FileHandler('/gitsync/data/action.log')
action_handler.setLevel(logging.INFO)
action_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
action_handler.setFormatter(action_formatter)

# Ajout des gestionnaires au logger
logger = logging.getLogger()
logger.addHandler(info_handler)
logger.addHandler(error_handler)
logger.addHandler(action_handler)

def load_repos(file_path):
    """Charge la configuration des dépôts depuis un fichier JSON."""
    with open(file_path, 'r') as file:
        return json.load(file)

def save_repos(file_path, data):
    """Sauvegarde la configuration des dépôts dans un fichier JSON."""
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)

def load_token(token_file_path):
    """Charge le token GitHub depuis un fichier JSON. Boucle jusqu'à ce qu'un token soit chargé."""
    while True:
        try:
            with open(token_file_path, 'r') as file:
                token_data = json.load(file)
                token = token_data.get('token')
                if token and token.strip():
                    logging.info("Token loaded successfully.")
                    return token
                else:
                    logging.error("Token not found or empty in file.")
        except (json.JSONDecodeError, FileNotFoundError) as e:
            logging.error(f"Error loading token: {e}")
        
        logging.info("Retrying to load token in 5 seconds...")
        time.sleep(5)

def send_ntfy_notification(topic, title, message):
    """Envoie une notification via ntfy."""
    url = f"https://ntfy.sh/{topic}"
    data = {
        "title": title,
        "message": message,
        "priority": 5
    }
    try:
        response = requests.post(url, json=data)
        response.raise_for_status()
        logging.info(f"Notification sent successfully to topic {topic}.")
    except requests.exceptions.RequestException as e:
        logging.error(f"Error sending notification: {e}")

def add_safe_directories(repos):
    """Ajoute les répertoires des dépôts à la configuration Git safe.directory."""
    for repo_info in repos:
        repo_path = "/user_sys" + repo_info['path']
        try:
            subprocess.run(['git', 'config', '--global', '--add', 'safe.directory', repo_path], check=True)
            logging.info(f"Added {repo_path} to safe.directory")
        except subprocess.CalledProcessError as e:
            logging.error(f"Error adding {repo_path} to safe.directory: {e}")

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

        # Incrémentation de la valeur de pull
        if 'pull' in repo_info:
            repo_info['pull'] = str(int(repo_info['pull']) + 1)

        logging.info(f"Repo {repo_info['name']} updated on branch {branch}")
        logging.getLogger().handlers[2].setLevel(logging.INFO)  # Set action log level
        logging.info(f"Action: Updated repo {repo_info['name']} on branch {branch}")

        # Exécuter la commande spécifiée après le pull, si présente
        if 'runCmd' in repo_info and repo_info['runCmd'].strip():
            cmd = repo_info['runCmd']
            logging.info(f"Running command for repo {repo_info['name']}: {cmd}")
            try:
                result = subprocess.run(cmd, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                logging.info(f"Command output: {result.stdout.decode()}")
                logging.error(f"Command error output: {result.stderr.decode()}")
                logging.getLogger().handlers[2].setLevel(logging.INFO)  # Set action log level
                logging.info(f"Action: Command output for repo {repo_info['name']}: {result.stdout.decode()}")
                logging.info(f"Action: Command error output for repo {repo_info['name']}: {result.stderr.decode()}")
            except subprocess.CalledProcessError as e:
                logging.error(f"Error running command for repo {repo_info['name']}: {e}")

        # Envoi de la notification ntfy
        if 'ntfy' in repo_info and repo_info['ntfy'].strip():
            topic = repo_info['ntfy']
            title = f"Repo {repo_info['name']} updated"
            message = f"Repo: {repo_info['name']}\nBranch: {branch}\nDate: {time.strftime('%Y-%m-%d %H:%M:%S')}\nLast Commit: {remote_commit.hexsha}"
            send_ntfy_notification(topic, title, message)


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

        # Ajouter les répertoires des dépôts à safe.directory
        add_safe_directories(repos)

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
