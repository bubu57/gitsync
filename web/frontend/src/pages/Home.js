import React, { useEffect, useState } from 'react';
import GitHub from 'github-api';
import axios from 'axios';

const Home = () => {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoDetails, setRepoDetails] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [UInt, setUInt] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    axios.get('/api/repos')
      .then(response => {
        setRepos(response.data.repos);
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des dépôts :', error);
      });
  }, []);

  const handleRepoClick = (repo) => {
    if (selectedRepo && selectedRepo.name === repo.name) {
      setSelectedRepo(null);
      setRepoDetails(null);
      setBranches([]);
      setSelectedBranch('');
    } else {
      setSelectedRepo(repo);
      fetchBranches(repo.owner, repo.name);
    }
  };

  const fetchRepoDetails = async (repoOwner, repoName, branch) => {
    try {
      const gh = new GitHub({ token });
      const repo = gh.getRepo(repoOwner, repoName);
      const repodata = await repo.getDetails();
      const lastCommit = await repo.getBranch(branch);
      setRepoDetails({
        name: repodata.data.name,
        owner: repodata.data.owner.login,
        url: repodata.data.html_url,
        lastCommitMessage: lastCommit.data.commit.commit.message,
        lastCommitAuthor: lastCommit.data.commit.author.login,
        lastCommitDate: new Date(lastCommit.data.commit.commit.author.date).toLocaleString(),
        lastCommitSha: lastCommit.data.commit.sha
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du dépôt :', error);
    }
  };

  const fetchBranches = async (repoOwner, repoName) => {
    try {
      const gh = new GitHub({ token });
      const repo = gh.getRepo(repoOwner, repoName);
      const branches = await repo.listBranches();
      setBranches(branches.data);
      setSelectedBranch(branches.data[0].name);
      fetchRepoDetails(repoOwner, repoName, branches.data[0].name);
    } catch (error) {
      console.error('Erreur lors de la récupération des branches :', error);
    }
  };

  const handleBranchChange = (event) => {
    const branch = event.target.value;
    setSelectedBranch(branch);
    fetchRepoDetails(selectedRepo.owner, selectedRepo.name, branch);
  };

  const handleUIntChange = (event) => {
    const newUInt = event.target.value;
    setUInt(newUInt);
  };

  const handleTokenChange = (event) => {
    setToken(event.target.value);
  };

  const handleTokenSubmit = () => {
    axios.post('/api/token', { token })
      .then(response => {
        console.log('Token enregistré avec succès');
      })
      .catch(error => {
        console.error('Erreur lors de l\'enregistrement du token :', error);
      });
  };

  return (
    <div className="home-container">
      <h2>Liste des Dépôts</h2>
      <ul>
        {repos.map((repo, index) => (
          <li key={index}>
            <a href="#!" onClick={() => handleRepoClick(repo)}>
              {repo.name}
            </a>
            {selectedRepo && selectedRepo.name === repo.name && (
              <div>
                <div>
                  <label htmlFor="branch-select">Sélectionnez une branche :</label>
                  <select
                    id="branch-select"
                    value={selectedBranch}
                    onChange={handleBranchChange}
                  >
                    {branches.map((branch, index) => (
                      <option key={index} value={branch.name}>{branch.name}</option>
                    ))}
                  </select>
                </div>
                {repoDetails && (
                  <div>
                    <h3>Détails du Dépôt: {repoDetails.name}</h3>
                    <p>Propriétaire: {repoDetails.owner}</p>
                    <p>URL: <a href={repoDetails.url}>{repoDetails.url}</a></p>
                    <p>Dernier commit: {repoDetails.lastCommitMessage}</p>
                    <p>Commit par: {repoDetails.lastCommitAuthor}</p>
                    <p>Date du dernier commit: {repoDetails.lastCommitDate}</p>
                    <p>SHA du dernier commit: {repoDetails.lastCommitSha}</p>
                    <h3>Paramètres</h3>
                    <p>Interval: </p>
                    <input 
                      type='number' 
                      value={UInt} 
                      onChange={handleUIntChange} 
                      placeholder={repo.UInt} 
                    />
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      <div>
        <h3>Accéder à vos dépôts privés</h3>
        <p>
          <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer">
            Créer un token d'accès GitHub
          </a>
        </p>
        <input 
          type='text' 
          value={token} 
          onChange={handleTokenChange} 
          placeholder="Entrez votre token GitHub" 
        />
        <button onClick={handleTokenSubmit}>Enregistrer le token</button>
      </div>
    </div>
  );
};

export default Home;
