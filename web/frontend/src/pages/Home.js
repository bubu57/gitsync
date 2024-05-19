import React, { useEffect, useState } from 'react';
import GitHub from 'github-api';
import axios from 'axios';

const Home = () => {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoDetails, setRepoDetails] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [token, setToken] = useState('');
  const [newToken, setNewToken] = useState('');
  const [updatedParams, setUpdatedParams] = useState({});

  useEffect(() => {
    axios.get('/api/token')
      .then(response => {
        setToken(response.data.token);
      })
      .catch(error => {
        console.error('Erreur lors de la récupération du token :', error);
      });
  }, []);

  useEffect(() => {
    axios.get('/api/repos', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        setRepos(response.data.repos);
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des dépôts :', error);
      });
  }, [token]);

  useEffect(() => {
    // Fetch current parameters when selected repository changes
    if (selectedRepo) {
      const { UInt, UlastPush, UpatCom } = selectedRepo;
      setUpdatedParams({ UInt, UlastPush, UpatCom });
    }
  }, [selectedRepo]);

  const handleRepoClick = (repo) => {
    if (selectedRepo && selectedRepo.name === repo.name) {
      setSelectedRepo(null); // Unselect if already selected
      setRepoDetails(null); // Clear repo details
      setBranches([]); // Clear branches
      setSelectedBranch(''); // Clear selected branch
    } else {
      setSelectedRepo(repo);
      fetchBranches(repo.owner, repo.name);
    }
  };

  const fetchRepoDetails = async (repoOwner, repoName, branch) => {
    try {
      const gh = new GitHub({ token: token }); // Use access token
      const repo = gh.getRepo(repoOwner, repoName);
      const repodata = await repo.getDetails();
      const lastCommit = await repo.getBranch(branch);
      console.log(lastCommit);
      console.log(repodata);
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
      const gh = new GitHub({ token: token }); // Use access token
      const repo = gh.getRepo(repoOwner, repoName);
      const branches = await repo.listBranches();
      setBranches(branches.data);
      setSelectedBranch(branches.data[0].name); // Set default selected branch
      fetchRepoDetails(repoOwner, repoName, branches.data[0].name); // Fetch details for the default branch
    } catch (error) {
      console.error('Erreur lors de la récupération des branches :', error);
    }
  };

  const handleBranchChange = (event) => {
    const branch = event.target.value;
    setSelectedBranch(branch);
    fetchRepoDetails(selectedRepo.owner, selectedRepo.name, branch);
  };

  const handleCreateAccessToken = () => {
    // Redirect user to GitHub to create a personal access token
    window.location.href = 'https://github.com/settings/tokens/new';
  };

  const handleTokenInputChange = (event) => {
    setNewToken(event.target.value);
  };

  const handleSaveToken = () => {
    axios.post('/api/ntoken', { token: newToken })
      .then(response => {
        setToken(newToken);
        setNewToken('');
      })
      .catch(error => {
        console.error('Erreur lors de l\'enregistrement du token :', error);
      });
  };

  const handleUpdateParams = () => {
    const updatedRepo = { ...selectedRepo, ...updatedParams };

    // Send updated repo data to backend
    axios.post('/api/updateRepoParams', updatedRepo)
      .then(response => {
        console.log('Paramètres mis à jour avec succès');
        // Refresh repo details
        setSelectedRepo(updatedRepo);
        fetchBranches(updatedRepo.owner, updatedRepo.name);
      })
      .catch(error => {
        console.error('Erreur lors de la mise à jour des paramètres du dépôt :', error);
      });
  };

  const handleInputChange = (event, parameter) => {
    const value = event.target.value;
    setUpdatedParams(prevParams => ({ ...prevParams, [parameter]: value }));
  };

  const handleDeleteParameter = (parameter) => {
    setUpdatedParams(prevParams => ({ ...prevParams, [parameter]: '' }));
    handleUpdateParams();
  };

  return (
    <div className="home-container">
      <h2>Liste des Dépôts</h2>
      {token ? (
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
                      <div>
                        <label htmlFor="UInt-input">UInt :</label>
                        <input 
                          type="text" 
                          id="UInt-input"
                          value={updatedParams.UInt} 
                          onChange={(event) => handleInputChange(event, 'UInt')} 
                        />
                        <button onClick={() => handleDeleteParameter('UInt')}>Supprimer</button>
                        <button onClick={handleUpdateParams}>Enregistrer</button>
                      </div>

                      <div>
                        <label htmlFor="UlastPush-input">UlastPush :</label>
                        <input 
                          type="text" 
                          id="UlastPush-input"
                          value={updatedParams.UlastPush} 
                          onChange={(event) => handleInputChange(event, 'UlastPush')} 
                        />
                        <button onClick={() => handleDeleteParameter('UlastPush')}>Supprimer</button>
                        <button onClick={handleUpdateParams}>Enregistrer</button>
                      </div>

                      <div>
                        <label htmlFor="UpatCom-input">UpatCom :</label>
                        <input 
                          type="text" 
                          id="UpatCom-input"
                          value={updatedParams.UpatCom} 
                          onChange={(event) => handleInputChange(event, 'UpatCom')} 
                        />
                        <button onClick={() => handleDeleteParameter('UpatCom')}>Supprimer</button>
                        <button onClick={handleUpdateParams}>Enregistrer</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <p>Veuillez créer un token d'accès personnel pour afficher les dépôts privés.</p>
          <button onClick={handleCreateAccessToken}>Créer un token d'accès</button>
          <div>
            <input 
              type="text" 
              placeholder="Entrez votre token d'accès" 
              value={newToken} 
              onChange={handleTokenInputChange} 
            />
            <button onClick={handleSaveToken}>Enregistrer le token</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;