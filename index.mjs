import express from 'express';
import fs from 'fs';
import bodyParser from 'body-parser';
import GitHubApi from 'github-api';
import cors from 'cors';

const app = express();
const port = parseInt(process.env.PORT) || process.argv[3] || 8080;


app.use(cors());
app.use(bodyParser.json());

const loadRepos = () => {
  if (fs.existsSync('repos.json')) {
    const data = fs.readFileSync('repos.json');
    return JSON.parse(data);
  }
  return { repos: [] };
};

const saveRepos = (repos) => {
  fs.writeFileSync('repos.json', JSON.stringify(repos, null, 2));
};

const logAction = (message) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync('actions.log', `[${timestamp}] ${message}\n`);
};

app.get('/repos', (req, res) => {
  const repos = loadRepos();
  res.json(repos.repos);
});

app.post('/repos', (req, res) => {
  const repos = loadRepos();
  const { owner, name, path } = req.body;
  repos.repos.push({ owner, name, path });
  saveRepos(repos);
  logAction(`Dépôt ajouté : ${owner}/${name} (Path: ${path})`);
  res.status(201).send('Dépôt ajouté.');
});

app.delete('/repos/:index', (req, res) => {
  const repos = loadRepos();
  const index = parseInt(req.params.index, 10);
  if (index >= 0 && index < repos.repos.length) {
    const removedRepo = repos.repos.splice(index, 1)[0];
    saveRepos(repos);
    logAction(`Dépôt supprimé : ${removedRepo.owner}/${removedRepo.name} (Path: ${removedRepo.path})`);
    res.send('Dépôt supprimé.');
  } else {
    res.status(404).send('Dépôt non trouvé.');
  }
});

app.get('/repos/:index/last-commit', async (req, res) => {
  const repos = loadRepos();
  const index = parseInt(req.params.index, 10);
  if (index >= 0 && index < repos.repos.length) {
    const repo = repos.repos[index];
    const gh = new GitHubApi();
    const repoInstance = gh.getRepo(repo.owner, repo.name);
    try {
      const commits = await repoInstance.listCommits();
      const latestCommit = commits.data[0];
      res.json({
        message: latestCommit.commit.message,
        date: latestCommit.commit.author.date,
      });
    } catch (error) {
      res.status(500).send('Erreur lors de la récupération des commits.');
    }
  } else {
    res.status(404).send('Dépôt non trouvé.');
  }
});

app.post('/repos/:index/update', (req, res) => {
  const repos = loadRepos();
  const index = parseInt(req.params.index, 10);
  if (index >= 0 && index < repos.repos.length) {
    const repo = repos.repos[index];
    exec(`cd ${repo.path} && git pull`, (error, stdout, stderr) => {
      if (error) {
        res.status(500).send(`Erreur lors de l'exécution de git pull: ${error.message}`);
      } else if (stderr) {
        res.status(500).send(`Erreur lors de l'exécution de git pull: ${stderr}`);
      } else {
        logAction(`Dépôt mis à jour manuellement : ${repo.owner}/${repo.name}`);
        res.send('Git pull effectué avec succès.');
      }
    });
  } else {
    res.status(404).send('Dépôt non trouvé.');
  }
});

app.listen(port, () => {
  console.log(`Serveur backend démarré sur le port ${port}`);
});
