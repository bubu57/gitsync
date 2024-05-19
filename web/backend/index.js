// Importer les modules nécessaires
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const { exec } = require('child_process');

// Créer une application Express
const app = express();
const PORT = parseInt(process.env.PORT) || process.argv[3] || 8080;

// Utiliser les middleware
app.use(express.json());
app.use(express.static('../frontend/build'));
app.use(bodyParser.json());

// Chemin du fichier repos.json
const reposFilePath = path.join(__dirname, '../../data/repos.json');
const tokenFilePath = path.join(__dirname, '../../data/token.json');

// Gérer les requêtes pour récupérer la liste des dépôts
app.get('/api/repos', (req, res) => {
  fs.readFile(reposFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Erreur lors de la lecture du fichier repos.json :', err);
      res.status(500).json({ error: 'Erreur lors de la lecture du fichier repos.json' });
      return;
    }
    const repos = JSON.parse(data);
    res.json(repos);
  });
});

app.get('/api/token', (req, res) => {
  console.log("ok")
  fs.readFile(tokenFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Erreur lors de la lecture du fichier repos.json :', err);
      res.status(500).json({ error: 'Erreur lors de la lecture du fichier repos.json' });
      return;
    }
    const repos = JSON.parse(data);
    res.json(repos);
  });
});

// Gérer les requêtes pour récupérer un dépôt spécifique
app.get('/api/repos/:name', (req, res) => {
  fs.readFile(reposFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Erreur lors de la lecture du fichier repos.json :', err);
      res.status(500).json({ error: 'Erreur lors de la lecture du fichier repos.json' });
      return;
    }
    const repos = JSON.parse(data);
    const repo = repos.repos.find(r => r.name === req.params.name);
    if (!repo) {
      res.status(404).json({ error: 'Dépôt non trouvé' });
      return;
    }
    res.json(repo);
  });
});

// Gérer les requêtes pour créer un dépôt
app.post('/api/repos', (req, res) => {
  const newRepo = req.body;
  if (!newRepo.name || !newRepo.path || !newRepo.owner) {
    return res.status(400).json({ error: 'Le nom, le chemin et le propriétaire du dépôt sont requis' });
  }

  fs.readFile(reposFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Erreur lors de la lecture du fichier repos.json :', err);
      res.status(500).json({ error: 'Erreur lors de la lecture du fichier repos.json' });
      return;
    }
    const repos = JSON.parse(data);
    repos.repos.push(newRepo);
    fs.writeFile(reposFilePath, JSON.stringify(repos, null, 4), (err) => {
      if (err) {
        console.error('Erreur lors de l\'écriture dans le fichier repos.json :', err);
        res.status(500).json({ error: 'Erreur lors de l\'écriture dans le fichier repos.json' });
        return;
      }
      res.json(newRepo);
    });
  });
});

// Gérer les requêtes pour effectuer un pull sur un dépôt
app.post('/api/repos/pull', (req, res) => {
  const { path } = req.body;
  if (!path) {
    return res.status(400).json({ error: 'Le chemin du dépôt est requis' });
  }

  exec(`git -C ${path} pull`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erreur lors de l'exécution de git pull : ${error}`);
      return res.status(500).json({ error: `Erreur lors de l'exécution de git pull : ${stderr}` });
    }

    res.json({ message: stdout });
  });
});

// Gérer toutes les autres requêtes en renvoyant le fichier index.html du frontend
app.get('/*', (_, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port: ${PORT}`);
});
