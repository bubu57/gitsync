import fs from 'fs';
import { ChildProcess, exec } from 'child_process';
import GitHubApi from 'github-api';
import inquirer from 'inquirer';
import clear from 'clear';

// Charger le fichier JSON contenant les dépôts
const loadRepos = () => {
  if (fs.existsSync('repos.json')) {
    const data = fs.readFileSync('repos.json');
    return JSON.parse(data);
  }
  return { repos: [] };
};

// Enregistrer les dépôts dans le fichier JSON
const saveRepos = (repos) => {
  fs.writeFileSync('repos.json', JSON.stringify(repos, null, 2));
};

// Journaliser les actions
const logAction = (message) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync('actions.log', `[${timestamp}] ${message}\n`);
};

// Lister les dépôts
const listRepos = () => {
  const repos = loadRepos();
  if (repos.repos.length === 0) {
    console.log('Aucun dépôt surveillé.');
  } else {
    console.log('Dépôts surveillés :');
    repos.repos.forEach((repo, index) => {
      console.log(`${index + 1}. ${repo.owner}/${repo.name} (Path: ${repo.path})`);
    });
  }
};

// Afficher les informations du dépôt et le dernier commit
const showLastCommit = async (owner, name) => {
  const gh = new GitHubApi();
  const repoInstance = gh.getRepo(owner, name);
  try {
    const repoDetails = await repoInstance.getDetails();
    const commits = await repoInstance.listCommits();
    const latestCommit = commits.data[0];

    console.log(`\nInformations sur le dépôt ${owner}/${name}:`);
    console.log(`Description : ${repoDetails.data.description || 'Aucune description'}`);
    console.log(`URL : ${repoDetails.data.html_url}`);
    console.log(`Dernier commit : ${latestCommit.commit.message}`);
    console.log(`Date et heure du dernier commit : ${new Date(latestCommit.commit.author.date).toLocaleString()}\n`);
  } catch (error) {
    console.error('Erreur lors de la récupération des informations du dépôt:', error);
  }
};

// Ajouter un dépôt
const addRepo = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'owner',
      message: 'Nom de l\'utilisateur du dépôt :',
    },
    {
      type: 'input',
      name: 'name',
      message: 'Nom du dépôt :',
    },
    {
      type: 'input',
      name: 'path',
      message: 'Chemin local du dépôt :',
    }
  ]);
  const repos = loadRepos();
  repos.repos.push({ owner: answers.owner, name: answers.name, path: answers.path });
  saveRepos(repos);
  logAction(`Dépôt ajouté : ${answers.owner}/${answers.name} (Path: ${answers.path})`);
  console.log('Dépôt ajouté.');
  mainMenu();
};

// Supprimer un dépôt
const removeRepo = async () => {
  const repos = loadRepos();
  if (repos.repos.length === 0) {
    console.log('Aucun dépôt à supprimer.');
    return mainMenu();
  }
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'repo',
      message: 'Sélectionnez le dépôt à supprimer :',
      choices: repos.repos.map((repo, index) => `${index + 1}. ${repo.owner}/${repo.name}`),
    }
  ]);
  const index = parseInt(answers.repo.split('.')[0], 10) - 1;
  const removedRepo = repos.repos.splice(index, 1)[0];
  saveRepos(repos);
  logAction(`Dépôt supprimé : ${removedRepo.owner}/${removedRepo.name} (Path: ${removedRepo.path})`);
  console.log('Dépôt supprimé.');
  mainMenu();
};

// Mettre à jour le dépôt maintenant
const updateRepoNow = (path) => {
  exec(`cd ${path} && git pull`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erreur lors de l'exécution de git pull: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Erreur lors de l'exécution de git pull: ${stderr}`);
      return;
    }
    console.log('Git pull effectué avec succès.');
    logAction(`Dépôt mis à jour manuellement : ${path}`);
  });
};

// Configurer la mise à jour du dépôt
const configureRepoUpdate = async (repo) => {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'updateMethod',
      message: 'Sélectionnez une méthode de mise à jour :',
      choices: ['À intervalle régulier', 'Par pattern dans le commit', 'Mettre à jour maintenant', 'Retour'],
    },
    {
      type: 'input',
      name: 'interval',
      message: 'Entrez l\'intervalle en minutes :',
      when: (answers) => answers.updateMethod === 'À intervalle régulier',
    },
    {
      type: 'input',
      name: 'pattern',
      message: 'Entrez le pattern à surveiller :',
      when: (answers) => answers.updateMethod === 'Par pattern dans le commit',
    },
  ]);

  if (answers.updateMethod === 'Mettre à jour maintenant') {
    updateRepoNow(repo.path);
  } else if (answers.updateMethod === 'À intervalle régulier') {
    const interval = parseInt(answers.interval, 10) * 60 * 1000;
    setInterval(() => {
      updateRepoNow(repo.path);
    }, interval);
    logAction(`Dépôt configuré pour mise à jour toutes les ${answers.interval} minutes : ${repo.owner}/${repo.name}`);
    console.log(`Mise à jour configurée pour toutes les ${answers.interval} minutes.`);
  } else if (answers.updateMethod === 'Par pattern dans le commit') {
    const pattern = answers.pattern;
    monitorRepoForPattern(repo, pattern);
    logAction(`Dépôt configuré pour mise à jour par pattern "${pattern}" : ${repo.owner}/${repo.name}`);
    console.log(`Mise à jour configurée pour le pattern "${pattern}".`);
  } else if (answers.updateMethod == 'Retour') {
    clear();
    mainMenu();
  }
};

// Surveiller les dépôts pour un pattern spécifique dans les commits
const monitorRepoForPattern = (repo, pattern) => {
  const gh = new GitHubApi();
  const repoInstance = gh.getRepo(repo.owner, repo.name);
  let lastCommitSha = '';

  const checkForPattern = () => {
    repoInstance.listCommits().then((response) => {
      const latestCommit = response.data[0];
      if (latestCommit.sha !== lastCommitSha && latestCommit.commit.message.includes(pattern)) {
        console.log(`Pattern "${pattern}" trouvé dans le commit: ${latestCommit.commit.message}`);
        exec(`cd ${repo.path} && git pull`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Erreur lors de l'exécution de git pull: ${error.message}`);
            return;
          }
          if (stderr) {
            console.error(`Erreur lors de l'exécution de git pull: ${stderr}`);
            return;
          }
          console.log('Git pull effectué avec succès.');
          logAction(`Dépôt mis à jour par pattern "${pattern}" : ${repo.owner}/${repo.name}`);
        });
        lastCommitSha = latestCommit.sha;
      }
    }).catch((error) => {
      console.error('Erreur lors de la récupération des commits:', error);
    });
  };

  setInterval(checkForPattern, 5 * 60 * 1000);
};

// Menu principal
const mainMenu = async () => {
  const repos = loadRepos();
  const choices = repos.repos.map((repo, index) => ({
    name: `${index + 1}. ${repo.owner}/${repo.name} (Path: ${repo.path})`,
    value: index
  }));
  choices.push(new inquirer.Separator());
  choices.push({ name: 'Ajouter un dépôt', value: 'add' });
  choices.push({ name: 'Supprimer un dépôt', value: 'remove' });
  choices.push({ name: 'Quitter', value: 'quit' });

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Sélectionnez une action :',
      choices: choices,
    }
  ]);

  if (typeof answer.action === 'number') {
    const repo = repos.repos[answer.action];
    await showLastCommit(repo.owner, repo.name);
    configureRepoUpdate(repo);
  } else {
    switch (answer.action) {
      case 'add':
        addRepo();
        break;
      case 'remove':
        removeRepo();
        break;
      case 'quit':
        process.exit();
    }
  }
};
      
// Démarrer le menu principal
mainMenu();