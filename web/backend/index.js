const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = parseInt(process.env.PORT) || process.argv[3] || 8080;

app.use(express.json());
app.use(express.static('../frontend/build'));
app.use(bodyParser.json());

const reposFilePath = path.join(__dirname, '../../data/repos.json');

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

app.get('/*', (_, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port: ${PORT}`);
});
