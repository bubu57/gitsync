const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const { exec } = require('child_process');
const simpleGit = require('simple-git');

const app = express();
const PORT = parseInt(process.env.PORT) || process.argv[3] || 9002;

app.use(express.json());
app.use(express.static('../frontend/build'));
app.use(bodyParser.json());

const devpath = "/gitsync_user_systeme_data"

const reposFilePath = path.join(__dirname, '../../data/repos.json');
const tokenFilePath = path.join(__dirname, '../../data/token.json');
const configFilePath = path.join(__dirname, '../../data/config.json');

function safedir() {
  exec(`cd / && git config --global --add safe.directory '*' `, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erreur lors de l'exécution de git pull : ${error}`);
    }
  });
}

setInterval(safedir, 1000);

app.get('/api/getconfig', (req, res) => {
  fs.readFile(configFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Erreur lors de la lecture du fichier config.json :', err);
      res.status(500).json({ error: 'Erreur lors de la lecture du fichier config.json' });
      return;
    }
    const configData = JSON.parse(data);
    res.json(configData);
  });
});

app.post('/api/setconfig', (req, res) => {
  const { scannpath } = req.body;
  fs.writeFile(configFilePath, JSON.stringify({ scannpath }), (err) => {
    if (err) {
      console.error('Erreur lors de l\'enregistrement du config :', err);
      res.status(500).json({ error: 'Erreur lors de l\'enregistrement du config' });
      return;
    }
    res.json({ message: 'Token enregistré avec succès' });
  });
});

app.post('/api/scanRepos', async (req, res) => {
  const rootDir = devpath + req.body.path;
  const repos = [];

  // Read the existing repositories from repos.json
  let existingRepos = [];
  try {
    const data = fs.readFileSync(reposFilePath, 'utf8');
    existingRepos = JSON.parse(data).repos;
  } catch (err) {
    console.error('Erreur lors de la lecture du fichier repos.json :', err);
    res.status(500).json({ error: 'Erreur lors de la lecture du fichier repos.json' });
    return;
  }

  const isRepoExisting = (path) => {
    if (path.startsWith('/gitsync_user_systeme_data')) {
      path = path.replace('/gitsync_user_systeme_data', '');
    }
    return existingRepos.some(repo => repo.path === path);
  };

  const scanDirectory = async (dir) => {
    let files;
    try {
      files = fs.readdirSync(dir);
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.warn(`Warning: Directory not found ${dir}`);
        return;
      }
      throw err;
    }

    for (const file of files) {
      let filePath = path.join(dir, file);
      let fileStat;
      try {
        fileStat = fs.statSync(filePath);
      } catch (err) {
        if (err.code === 'ENOENT') {
          console.warn(`Warning: File not found ${filePath}`);
          continue;
        }
        throw err;
      }

      if (fileStat.isDirectory()) {
        if (fs.existsSync(path.join(filePath, '.git'))) {
          if (isRepoExisting(filePath)) {
            console.log(`Skipping existing repository: ${filePath}`);
            continue;
          }

          const git = simpleGit(filePath);
          let remotes;
          try {
            remotes = await git.getRemotes(true);
          } catch (error) {
            console.error(`Error getting remotes for ${filePath}:`, error);
            continue;
          }
          const originRemote = remotes.find(remote => remote.name === 'origin');
          if (originRemote) {
            let repoUrl;
            try {
              repoUrl = new URL(originRemote.refs.fetch);
            } catch (err) {
              const sshMatch = originRemote.refs.fetch.match(/git@([^:]+):(.+)\/(.+)\.git/);
              if (sshMatch) {
                repoUrl = {
                  host: sshMatch[1],
                  owner: sshMatch[2],
                  name: sshMatch[3]
                };
              } else {
                console.error(`Invalid URL format for ${originRemote.refs.fetch}`);
                continue;
              }
            }
            const owner = repoUrl.owner || repoUrl.pathname.split('/')[1];
            const name = repoUrl.name || repoUrl.pathname.split('/')[2].replace('.git', '');
            if (filePath.startsWith('/gitsync_user_systeme_data')) {
              filePath = filePath.replace('/gitsync_user_systeme_data', ''); // This line now works
            }
            repos.push({
              owner: owner,
              name: name,
              path: filePath,
              branch: (await git.branchLocal()).current
            });
          }
        } else {
          await scanDirectory(filePath);
        }
      }
    }
  };

  try {
    console.log(`Scanning directory: ${rootDir}`);
    await scanDirectory(rootDir);
    console.log(`Found repositories: ${JSON.stringify(repos)}`);
    res.json({ repos });
  } catch (error) {
    console.error('Error during scanning:', error);
    res.status(500).json({ error: error.message });
  }
});


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
  let newRepo = req.body;

  // Check and remove '/user_sys' prefix from the path if it exists
  if (newRepo.path.startsWith('/gitsync_user_systeme_data')) {
    newRepo.path = newRepo.path.replace('/gitsync_user_systeme_data', '');
  }

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

    exec(`git config --global --add safe.directory '${newRepo.path}'`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erreur lors de l'exécution de git config : ${error}`);
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