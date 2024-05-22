import React, { useEffect, useState } from 'react';
import GitHub from 'github-api';
import axios from 'axios';
import './Home.css'; // Import du CSS

const Home = () => {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoDetails, setRepoDetails] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [token, setToken] = useState('');
  const [newToken, setNewToken] = useState('');
  const [updatedParams, setUpdatedParams] = useState({});
  const [showAlert, setShowAlert] = useState(false);
  const [newRepo, setNewRepo] = useState({
    owner: '',
    name: '',
    path: '',
    branch: '',
    lastCommitSha: '',
    UInt: '',
    UlastPush: '',
    UpatCom: '',
    runCmd: ''
  });
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [showTokenSection, setShowTokenSection] = useState(false);

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
    if (token) {
      axios.get('/api/repos', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => {
          setRepos(response.data.repos);
        })
        .catch(error => {
          console.error('Erreur lors de la récupération des dépôts :', error);
        });
    }
  }, [token]);

  useEffect(() => {
    if (selectedRepo) {
      const { branch, UInt, UlastPush, UpatCom, runCmd } = selectedRepo;
      setUpdatedParams({ branch, UInt, UlastPush, UpatCom, runCmd });
    }
  }, [selectedRepo]);

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
      const gh = new GitHub({ token: token }); 
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
      const gh = new GitHub({ token: token }); 
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

  const handleCreateAccessToken = () => {
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
        setShowAlert(true); 
        setTimeout(() => setShowAlert(false), 3000); 
      })
      .catch(error => {
        console.error('Erreur lors de l\'enregistrement du token :', error);
      });
  };

  const handleUpdateParams = () => {
    const updatedRepo = { ...selectedRepo, ...updatedParams };
    axios.post('/api/updateRepoParams', updatedRepo)
      .then(response => {
        setSelectedRepo(updatedRepo);
        fetchBranches(updatedRepo.owner, updatedRepo.name);
        setShowAlert(true); 
        setTimeout(() => setShowAlert(false), 3000); 
      })
      .catch(error => {
        console.error('Erreur lors de la mise à jour des paramètres du dépôt :', error);
      });
  };

  const handleInputChange = (event, parameter) => {
    const value = event.target.value;
    setUpdatedParams(prevParams => ({ ...prevParams, [parameter]: value }));
  };

  const handleAddRepo = () => {
    axios.post('/api/addrepo', newRepo)
      .then(response => {
        setRepos([...repos, newRepo]);
        setNewRepo({
          owner: '',
          name: '',
          path: '',
          branch: '',
          lastCommitSha: '',
          UInt: '',
          UlastPush: '',
          UpatCom: '',
          runCmd: ''
        });
        setShowAlert(true); 
        setTimeout(() => setShowAlert(false), 3000); 
      })
      .catch(error => {
        console.error('Erreur lors de l\'ajout du dépôt :', error);
      });
  };

  const handleDeleteRepo = (repoName) => {
    axios.post('/api/delrepo', { name: repoName })
      .then(response => {
        setRepos(repos.filter(repo => repo.name !== repoName));
        setShowAlert(true); 
        setTimeout(() => setShowAlert(false), 3000); 
      })
      .catch(error => {
        console.error('Erreur lors de la suppression du dépôt :', error);
      });
  };

  return (
    <div className="home-container">
      <h2>Liste des Dépôts</h2>
      {token ? (
        <>
          <ul>
            {repos.map((repo, index) => (
              <li key={index} className="fadeIn">
                <a href="#!" onClick={() => handleRepoClick(repo)}>
                  {repo.name}
                </a>
                <button onClick={() => handleDeleteRepo(repo.name)}>Supprimer</button>
                {selectedRepo && selectedRepo.name === repo.name && (
                  <div className="repo-details slideIn">
                    <div>
                      <label htmlFor="branch-select">Sélectionnez une branche :</label>
                      <select
                        id="branch-select"
                        value={selectedBranch}
                        onChange={handleBranchChange}
                      >
                        {branches.map((branchl, index) => (
                          <option key={index} value={branchl.name}>{branchl.name}</option>
                        ))}
                      </select>
                    </div>
                    {repoDetails && (
                      <div>
                        <h3>Détails du Dépôt: {repoDetails.name}</h3>
                        <p><b>Propriétaire:</b> {repoDetails.owner}</p>
                        <p><b>URL:</b> <a href={repoDetails.url}>{repoDetails.url}</a></p>
                        <p><b>Dernier commit:</b> {repoDetails.lastCommitMessage}</p>
                        <p><b>Commit par:</b> {repoDetails.lastCommitAuthor}</p>
                        <p><b>Date du dernier commit:</b> {repoDetails.lastCommitDate}</p>
                        <h3>Paramètres</h3>
                        <div className="input-group">
                          <label htmlFor="UInt-input">Branch a mettre a jour</label>
                          <input 
                            type="text" 
                            id="Branch-input"
                            value={updatedParams.branch} 
                            onChange={(event) => handleInputChange(event, 'branch')} 
                          />
                        </div>
            
                        <div className="input-group">
                          <label htmlFor="UInt-input">Pull par interval :</label>
                          <input 
                            type="text" 
                            id="UInt-input"
                            value={updatedParams.UInt} 
                            onChange={(event) => handleInputChange(event, 'UInt')} 
                          />
                        </div>

                        <div className="input-group">
                          <label htmlFor="UlastPush-input">Pull lors du dernier push (true or empty) :</label>
                          <input
                            type="text" 
                            id="UlastPush-input"
                            value={updatedParams.UlastPush} 
                            onChange={(event) => handleInputChange(event, 'UlastPush')} 
                          />
                        </div>

                        <div className="input-group">
                          <label htmlFor="UpatCom-input">Pull avec pattern dans le dernier commit :</label>
                          <input 
                            type="text" 
                            id="UpatCom-input"
                            value={updatedParams.UpatCom} 
                            onChange={(event) => handleInputChange(event, 'UpatCom')} 
                          />
                        </div>

                        <div className="input-group">
                          <label htmlFor="runCmd-input">run command after pull :</label>
                          <input 
                            type="text" 
                            id="runCmd-input"
                            value={updatedParams.runCmd} 
                            onChange={(event) => handleInputChange(event, 'runCmd')} 
                          />
                        </div>
                        <button onClick={handleUpdateParams}>Enregistrer les paramètres</button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <button className="toggle-button" onClick={() => setShowAddRepo(!showAddRepo)}>
            {showAddRepo ? 'Masquer le formulaire d\'ajout de dépôt' : 'Ajouter un nouveau dépôt'}
          </button>
          {showAddRepo && (
            <div className="add-repo-form slideIn">
              <h2>Ajouter un nouveau dépôt</h2>
              <input
                type="text"
                placeholder="Propriétaire"
                value={newRepo.owner}
                onChange={(e) => setNewRepo({ ...newRepo, owner: e.target.value })}
              />
              <input
                type="text"
                placeholder="Nom"
                value={newRepo.name}
                onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Chemin"
                value={newRepo.path}
                onChange={(e) => setNewRepo({ ...newRepo, path: e.target.value })}
              />
              <input
                type="text"
                placeholder="Branche"
                value={newRepo.branch}
                onChange={(e) => setNewRepo({ ...newRepo, branch: e.target.value })}
              />
              <input
                type="text"
                placeholder="Pull par interval"
                value={newRepo.UInt}
                onChange={(e) => setNewRepo({ ...newRepo, UInt: e.target.value })}
              />
              <input
                type="text"
                placeholder="Pull lors du dernier push (true or empty)"
                value={newRepo.UlastPush}
                onChange={(e) => setNewRepo({ ...newRepo, UlastPush: e.target.value })}
              />
              <input
                type="text"
                placeholder="Pull avec pattern dans le dernier commit"
                value={newRepo.UpatCom}
                onChange={(e) => setNewRepo({ ...newRepo, UpatCom: e.target.value })}
              />
              <input
                type="text"
                placeholder="run command after pull"
                value={newRepo.runCmd}
                onChange={(e) => setNewRepo({ ...newRepo, runCmd: e.target.value })}
              />
              <button onClick={handleAddRepo}>Ajouter</button>
            </div>
          )}
          <button className="toggle-button" onClick={() => setShowTokenSection(!showTokenSection)}>
            {showTokenSection ? 'Masquer le formulaire de token' : 'Changer le token d\'accès'}
          </button>
          {showTokenSection && (
            <div className="token-form slideIn">
              <h2>Changer le token d'accès</h2>
              <input
                type="text"
                placeholder="Nouveau token"
                value={newToken}
                onChange={handleTokenInputChange}
              />
              <button onClick={handleSaveToken}>Enregistrer le token</button>
              <button onClick={handleCreateAccessToken}>Créer un nouveau token</button>
            </div>
          )}
        </>
      ) : (
        <>
          <h2>Changer le token d'accès</h2>
          <div className="token-form">
            <input
              type="text"
              placeholder="Nouveau token"
              value={newToken}
              onChange={handleTokenInputChange}
            />
            <button onClick={handleSaveToken}>Enregistrer le token</button>
            <button onClick={handleCreateAccessToken}>Créer un nouveau token</button>
          </div>
        </>
      )}
      {showAlert && <p className="alert">Opération réussie !</p>}
    </div>
  );
};

export default Home;