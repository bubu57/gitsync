const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = parseInt(process.env.PORT) || process.argv[3] || 9002;

app.use(express.json());
app.use(express.static('../frontend/build'));
app.use(bodyParser.json());

const reposFilePath = path.join(__dirname, '../../data/repos.json');
const tokenFilePath = path.join(__dirname, '../../data/token.json');

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

app.post('/api/ntoken', (req, res) => {
  const { token } = req.body;
  fs.writeFile(tokenFilePath, JSON.stringify({ token }), (err) => {
    if (err) {
      console.error('Erreur lors de l\'enregistrement du token :', err);
      res.status(500).json({ error: 'Erreur lors de l\'enregistrement du token' });
      return;
    }
    res.json({ message: 'Token enregistré avec succès' });
  });
});

app.get('/api/token', (req, res) => {
  fs.readFile(tokenFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Erreur lors de la lecture du fichier token.json :', err);
      res.status(500).json({ error: 'Erreur lors de la lecture du fichier token.json' });
      return;
    }
    const tokenData = JSON.parse(data);
    res.json(tokenData);
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

app.post('/api/repos/:name/update', (req, res) => {
  const { name } = req.params;
  const { UInt, UlastPush, UpatCom, branch } = req.body;
  fs.readFile(reposFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Erreur lors de la lecture du fichier repos.json :', err);
      res.status(500).json({ error: 'Erreur lors de la lecture du fichier repos.json' });
      return;
    }
    const repos = JSON.parse(data);
    const repoIndex = repos.repos.findIndex(r => r.name === name);
    if (repoIndex === -1) {
      res.status(404).json({ error: 'Dépôt non trouvé' });
      return;
    }
    if (UInt !== undefined) repos.repos[repoIndex].UInt = UInt;
    if (UlastPush !== undefined) repos.repos[repoIndex].UlastPush = UlastPush;
    if (UpatCom !== undefined) repos.repos[repoIndex].UpatCom = UpatCom;
    if (branch !== undefined) repos.repos[repoIndex].branch = branch;
    fs.writeFile(reposFilePath, JSON.stringify(repos, null, 2), (err) => {
      if (err) {
        console.error('Erreur lors de la mise à jour des paramètres du dépôt :', err);
        res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres du dépôt' });
        return;
      }
      res.json({ message: 'Paramètres du dépôt mis à jour avec succès' });
    });
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

app.post('/api/updateRepoParams', async (req, res) => {
  const updatedRepo = req.body;

  try {
    let repoData = fs.readFileSync(reposFilePath, 'utf-8');
    let repos = JSON.parse(repoData).repos;

    if (!Array.isArray(repos)) {
      res.status(500).json({ message: 'Le fichier repos.json ne contient pas un tableau de dépôts' });
      return;
    }

    const index = repos.findIndex(repo => repo.name === updatedRepo.name);
    if (index !== -1) {
      repos[index] = { ...repos[index], ...updatedRepo };

      fs.writeFileSync(reposFilePath, JSON.stringify({ repos }, null, 2));

      res.status(200).json({ message: 'Paramètres du dépôt mis à jour avec succès' });
    } else {
      res.status(404).json({ message: 'Dépôt non trouvé' });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres du dépôt :', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour des paramètres du dépôt' });
  }
});

app.post('/api/addrepo', (req, res) => {
  const newRepo = req.body;

  fs.readFile(reposFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Erreur lors de la lecture du fichier repos.json :', err);
      res.status(500).json({ error: 'Erreur lors de la lecture du fichier repos.json' });
      return;
    }

    const repos = JSON.parse(data);
    repos.repos.push(newRepo);

    fs.writeFile(reposFilePath, JSON.stringify(repos, null, 2), (err) => {
      if (err) {
        console.error('Erreur lors de l\'ajout du dépôt :', err);
        res.status(500).json({ error: 'Erreur lors de l\'ajout du dépôt' });
        return;
      }

      res.json({ message: 'Dépôt ajouté avec succès' });
    });

    exec(`git config --system --add safe.directory '${newRepo.path}'`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erreur lors de l'exécution de git pull : ${error}`);
        return res.status(500).json({ error: `Erreur lors de l'exécution de git pull : ${stderr}` });
      }
    });
  });
});

app.post('/api/delrepo', (req, res) => {
  const { name } = req.body;

  fs.readFile(reposFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Erreur lors de la lecture du fichier repos.json :', err);
      res.status(500).json({ error: 'Erreur lors de la lecture du fichier repos.json' });
      return;
    }

    let repos = JSON.parse(data);
    repos.repos = repos.repos.filter(repo => repo.name !== name);

    fs.writeFile(reposFilePath, JSON.stringify(repos, null, 2), (err) => {
      if (err) {
        console.error('Erreur lors de la suppression du dépôt :', err);
        res.status(500).json({ error: 'Erreur lors de la suppression du dépôt' });
        return;
      }

      res.json({ message: 'Dépôt supprimé avec succès' });
    });
  });
});

app.get('/*', (_, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port: ${PORT}`);
});

