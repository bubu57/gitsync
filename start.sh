#!/bin/bash

# Vérifie si le dossier 'data' existe
if [[ ! -d "data" ]]; then
    mkdir data
fi

# Vérifie la présence du fichier token.json
if [[ ! -f "data/token.json" ]]; then
    echo '{"token":""}' > data/token.json
fi

# Vérifie la présence du fichier repos.json
if [[ ! -f "data/repos.json" ]]; then
    echo '{"repos":[]}' > data/repos.json
fi

# Vérifie la présence de Docker et Docker Compose
if ! command -v docker &> /dev/null; then
    echo "Erreur : Docker n'est pas installé."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Erreur : Docker Compose n'est pas installé."
    exit 1
fi