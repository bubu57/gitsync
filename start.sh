#!/bin/bash

# Vérifie si le script est exécuté en tant que root
if [[ $(id -u) -eq 0 ]]; then
    echo "Ce script ne doit pas être exécuté en tant que root."
    exit 1
fi

# Vérifie si le dossier 'data' existe
if [[ ! -d "data" ]]; then
    echo "Erreur : Le dossier 'data' n'existe pas. Veuillez executer le setup.sh avant de lancer le script."
    exit 1
fi

# Vérifie la présence du fichier token.json
if [[ ! -f "data/token.json" ]]; then
    echo "Erreur : Le fichier 'token.json' n'existe pas dans le dossier 'data'. Veuillez executer le setup.sh avant de lancer le script."
    exit 1
fi

# Vérifie la présence du fichier repos.json
if [[ ! -f "data/repos.json" ]]; then
    echo "Erreur : Le fichier 'repos.json' n'existe pas dans le dossier 'data'. Veuillez executer le setup.sh avant de lancer le script."
    exit 1
fi

# Vérifie si l'option -d est passée en argument
if [[ "$1" == "-d" ]]; then
    # Vérifie la présence de Docker et Docker Compose
    if ! command -v docker &> /dev/null; then
        echo "Erreur : Docker n'est pas installé."
        exit 1
    fi
    if ! command -v docker-compose &> /dev/null; then
        echo "Erreur : Docker Compose n'est pas installé."
        exit 1
    fi
    # Démarrage de l'application en mode Docker
    docker-compose up -d
else
    # Vérifie la présence du dossier node_modules dans web/backend et web/frontend
    if [[ ! -d "web/backend/node_modules" || ! -d "web/frontend/node_modules" ]]; then
        echo "Erreur : Les dossiers 'node_modules' ne sont pas présents dans 'web/backend' ou 'web/frontend'."
        exit 1
    fi
    # Démarrage du script d'automatisation Python en arrière-plan
    python3 "$PYTHON_SCRIPT" &

    # Capture le PID du script Python
    PYTHON_PID=$!

    # Démarrage du serveur npm
    npm start &

    # Capture le PID du serveur npm
    NPM_PID=$!

    # Fonction pour gérer la fin du script
    cleanup() {
        echo "Arrêt du script d'automatisation (PID $PYTHON_PID) et du serveur npm (PID $NPM_PID)"
        kill $PYTHON_PID
        kill $NPM_PID
    }

    # Gestion de l'interruption (Ctrl+C)
    trap cleanup SIGINT

    # Attente de la fin des deux processus
    wait $PYTHON_PID
    wait $NPM_PID
fi
