const fs = require('fs');
const { exec } = require('child_process');
const GitHubApi = require('github-api');
const inquirer = require('inquirer');

// Charger le fichier JSON contenant les dépôts
const loadRepos = () => {
  if (fs.existsSync('repo.json')) {
    const data = fs.readFileSync('repo.json');
    return JSON.parse(data);
  }
  return { repos: [] };
};

// Enregistrer les dépôts dans le fichier JSON
const saveRepos = (repos) => {
  fs.writeFileSync('repo.json', JSON.stringify(repos, null, 2));
};

// Menu principal
const mainMenu = () => {
  inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Que voulez-vous faire ?',
      choices: ['Lister les dépôts', 'Ajouter un dépôt', 'Supprimer un dépôt', 'Quitter'],
    }
  ]).then((answers) => {
    switch (answers.action) {
      case 'Lister les dépôts':
        listRepos();
        break;
      case 'Ajouter un dépôt':
        addRepo();
        break;
      case 'Supprimer un dépôt':
        removeRepo();
        break;
      case 'Quitter':
        process.exit();
    }
  });
};

// Lister les dépôts
const listRepos = () => {
  const repos = loadRepos();
  console.log('Dépôts surveillés :');
  repos.repos.forEach((repo, index) => {
    console.log(`${index + 1}. ${repo.owner}/${repo.name}`);
  });
  mainMenu();
};

// Ajouter un dépôt
const addRepo = () => {
  inquirer.prompt([
    {
      type: 'input',
      name: 'owner',
      message: 'Nom de l\'utilisateur du dépôt :',
    },
    {
      type: 'input',
      name: 'name',
      message: 'Nom du dépôt :',
    }
  ]).then((answers) => {
    const repos = loadRepos();
    repos.repos.push({ owner: answers.owner, name: answers.name });
    saveRepos(repos);
    console.log('Dépôt ajouté.');
    mainMenu();
  });
};

// Supprimer un dépôt
const removeRepo = () => {
  const repos = loadRepos();
  inquirer.prompt([
    {
      type: 'list',
      name: 'repo',
      message: 'Sélectionnez le dépôt à supprimer :',
      choices: repos.repos.map((repo, index) => `${index + 1}. ${repo.owner}/${repo.name}`),
    }
  ]).then((answers) => {
    const index = parseInt(answers.repo.split('.')[0], 10) - 1;
    repos.repos.splice(index, 1);
    saveRepos(repos);
    console.log('Dépôt supprimé.');
    mainMenu();
  });
};

// Surveiller les mises à jour des dépôts
const monitorRepos = () => {
  const repos = loadRepos();
  repos.repos.forEach((repo) => {
    const gh = new GitHubApi();
    const repoInstance = gh.getRepo(repo.owner, repo.name);
    let lastCommitSha = '';

    const checkForUpdates = () => {
      repoInstance.listCommits().then((response) => {
        const latestCommit = response.data[0];
        if (latestCommit.sha !== lastCommitSha) {
          console.log(`Nouveau commit dans ${repo.owner}/${repo.name}: ${latestCommit.commit.message}`);
          exec('git pull', (error, stdout, stderr) => {
            if (error) {
              console.error(`Erreur lors de l'exécution de git pull: ${error.message}`);
              return;
            }
            if (stderr) {
              console.error(`Erreur lors de l'exécution de git pull: ${stderr}`);
              return;
            }
            console.log('Git pull effectué avec succès.');
          });
          lastCommitSha = latestCommit.sha;
        }
      }).catch((error) => {
        console.error('Erreur lors de la récupération des commits:', error);
      });
    };

    setInterval(checkForUpdates, 5 * 60 * 1000);
  });
};

// Démarrer le menu principal
mainMenu();

// Démarrer la surveillance des dépôts
monitorRepos();
