import React, { useEffect, useState, useRef } from 'react';
import GitHub from 'github-api';
import axios from 'axios';
import RepoChart from './RepoChart';
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
  let [alertmessage, setalertmessage] = useState('');
  const [nbrepos, setNbrepos] = useState(0);
  const [newRepo, setNewRepo] = useState({
    owner: '',
    name: '',
    path: '',
    branch: '',
    lastCommitSha: '',
    UInt: '',
    UlastPush: '',
    UpatCom: '',
    runCmd: '', 
    ntfy: '',
    pull: ''
  });
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [showTokenSection, setShowTokenSection] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [foundRepos, setFoundRepos] = useState([]);
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [ShowScannRepo, setShowScannRepo] = useState(false);

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
          setNbrepos(response.data.repos.length);
        })
        .catch(error => {
          console.error('Error fetching repositories:', error);
        });
    }
  }, [token]);

  useEffect(() => {
    if (selectedRepo) {
      const { branch, UInt, UlastPush, UpatCom, runCmd, ntfy } = selectedRepo;
      setUpdatedParams({ branch, UInt, UlastPush, UpatCom, runCmd, ntfy });
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
      console.error('Error fetching repository details:', error);
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
      console.error('Error fetching branches:', error);
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
        setalertmessage('Operation successful')
        setShowAlert(true); 
        setTimeout(() => setShowAlert(false), 3000); 
      })
      .catch(error => {
        console.error('Error saving token:', error);
      });
  };

  const handleUpdateParams = () => {
    const updatedRepo = { ...selectedRepo, ...updatedParams };
    axios.post('/api/updateRepoParams', updatedRepo)
      .then(response => {
        setSelectedRepo(updatedRepo);
        fetchBranches(updatedRepo.owner, updatedRepo.name);
        setalertmessage('Operation successful')
        setShowAlert(true); 
        setTimeout(() => setShowAlert(false), 3000); 
      })
      .catch(error => {
        console.error('Error updating repository parameters:', error);
      });
  };

  const handleInputChange = (event, parameter) => {
    const value = event.target.value;
    setUpdatedParams(prevParams => ({ ...prevParams, [parameter]: value }));
  };

  const handleAddRepo = () => {
    if (!newRepo.owner || !newRepo.name || !newRepo.path || !newRepo.branch) {
      setalertmessage('Please fill in the first 4 fields')
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }
    console.log(newRepo)
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
          runCmd: '',
          ntfy: '',
          pull: ''
        });
        setalertmessage('Operation successful')
        setShowAlert(true); 
        setTimeout(() => setShowAlert(false), 3000); 
      })
      .catch(error => {
        console.error('Error adding repository:', error);
      });
  };

  const handleDeleteRepo = (repoName) => {
    axios.post('/api/delrepo', { name: repoName })
      .then(response => {
        const updatedRepos = repos.filter(repo => repo.name !== repoName);
        setRepos(updatedRepos);
        setalertmessage('Operation successful')
        setShowAlert(true); 
        setTimeout(() => setShowAlert(false), 3000); 
      })
      .catch(error => {
        console.error('Error deleting repository:', error);
      });
  };

  



  const handleScan = async () => {
    setShowScannRepo(!ShowScannRepo)
    setScanning(true);
    setProgress(0);
    
    try {
      const response = await axios.post('/api/scanRepos', { path: '/home/user' }, {
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        }
      });
      setFoundRepos(response.data.repos);
    } catch (error) {
      console.error('Erreur lors du scan des dépôts :', error);
    } finally {
      setScanning(false);
    }
  };

  const handleRepoSelect = (repo) => {
    setSelectedRepos(prevSelected => {
      if (prevSelected.includes(repo)) {
        return prevSelected.filter(r => r !== repo);
      } else {
        return [...prevSelected, repo];
      }
    });
  };

  const handleAddSelectedRepos = async () => {
    for (const repo of selectedRepos) {
      const newRepo = {
        owner: repo.owner,
        name: repo.name,
        path: repo.path,
        branch: repo.branch,
        lastCommitSha: '',
        UInt: '',
        UlastPush: '',
        UpatCom: '',
        runCmd: '',
        ntfy: '',
        pull: ''
      };
  
      try {
        await axios.post('/api/addrepo', newRepo);
        setRepos(prevRepos => [...prevRepos, newRepo]);
        setalertmessage('Operation successful');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      } catch (error) {
        console.error('Error adding repository:', error);
      }
    }
  };


  return (
    <div className="home-container">
      {showAlert && <p className="alert">{alertmessage}</p>}
      <h2>Repository {nbrepos}</h2>
      {token ? (
        <>
          <ul>
            {repos.map((repo, index) => (
              <li key={index} className="fadeIn">
                <a href="#!" onClick={() => handleRepoClick(repo)}>
                  {repo.name}
                </a>
                <button onClick={() => handleDeleteRepo(repo.name)}>Delete</button>
                {selectedRepo && selectedRepo.name === repo.name && (
                  <div className="repo-details slideIn">
                    <div>
                      <label htmlFor="branch-select">Select a branch:</label>
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
                      <h3>Repository Details: {repoDetails.name}</h3>
                      <p><b>Owner:</b> {repoDetails.owner}</p>
                      <p><b>URL:</b> <a href={repoDetails.url}>{repoDetails.url}</a></p>
                      <p><b>Last commit:</b> {repoDetails.lastCommitMessage}</p>
                      <p><b>Commit by:</b> {repoDetails.lastCommitAuthor}</p>
                      <p><b>Date of last commit:</b> {repoDetails.lastCommitDate}</p>
                      <h3>Parameters</h3>
                      <div className="input-group">
                        <label htmlFor="UInt-input">Branch to be updated</label>
                        <input 
                          type="text" 
                          id="Branch-input"
                          value={updatedParams.branch} 
                          onChange={(event) => handleInputChange(event, 'branch')}
                          required
                        />
                      </div>
          
                      <div className="input-group">
                        <label htmlFor="UInt-input">Pull per interval:</label>
                        <input 
                          type="text" 
                          id="UInt-input"
                          value={updatedParams.UInt} 
                          onChange={(event) => handleInputChange(event, 'UInt')} 
                        />
                      </div>

                      <div className="input-group">
                        <label htmlFor="UlastPush-input">Pull on last push (true or empty):</label>
                        <input
                          type="text" 
                          id="UlastPush-input"
                          value={updatedParams.UlastPush} 
                          onChange={(event) => handleInputChange(event, 'UlastPush')} 
                        />
                      </div>

                      <div className="input-group">
                        <label htmlFor="UpatCom-input">Pull with pattern in last commit:</label>
                        <input 
                          type="text" 
                          id="UpatCom-input"
                          value={updatedParams.UpatCom} 
                          onChange={(event) => handleInputChange(event, 'UpatCom')} 
                        />
                      </div>

                      <div className="input-group">
                        <label htmlFor="runCmd-input">Run command after pull:</label>
                        <input 
                          type="text" 
                          id="runCmd-input"
                          value={updatedParams.runCmd} 
                          onChange={(event) => handleInputChange(event, 'runCmd')} 
                        />
                      </div>

                      <div className="input-group">
                        <label htmlFor="runCmd-input">Notification topic if you want to be alerted of a repo update</label>
                        <input 
                          type="text" 
                          id="ntfy-input"
                          value={updatedParams.ntfy} 
                          onChange={(event) => handleInputChange(event, 'ntfy')}
                        />
                      </div>
                      <button onClick={handleUpdateParams}>Save Parameters</button>
                    </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>


          <button onClick={handleScan} disabled={scanning}>
            {ShowScannRepo ? 'Close scann' : 'Scanner les dépôts GitHub'}
          </button>
          {ShowScannRepo && (
            <div>
              {scanning && <div>Progress: {progress}%</div>}
              <ul>
                {foundRepos.map((repo, index) => (
                  <li key={index}>
                    <label>
                      <input 
                        type="checkbox" 
                        checked={selectedRepos.includes(repo)}
                        onChange={() => handleRepoSelect(repo)}
                      />
                      {repo.name} - {repo.owner} - {repo.path} - {repo.branch}
                    </label>
                  </li>
                ))}
              </ul>
              {selectedRepos.length > 0 && <button onClick={handleAddSelectedRepos}>Ajouter les dépôts sélectionnés</button>}
              <p><br/></p>
            </div>
          )}


          <button className="toggle-button" onClick={() => setShowAddRepo(!showAddRepo)}>
            {showAddRepo ? 'Hide Repository Addition Form' : 'Add a New Repository'}
          </button>
          {showAddRepo && (
            <div className="add-repo-form slideIn">
              <h2>Add a New Repository</h2>
              <input
                type="text"
                placeholder="Owner"
                value={newRepo.owner}
                onChange={(e) => setNewRepo({ ...newRepo, owner: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Name"
                value={newRepo.name}
                onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Path"
                value={newRepo.path}
                onChange={(e) => setNewRepo({ ...newRepo, path: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Branch"
                value={newRepo.branch}
                onChange={(e) => setNewRepo({ ...newRepo, branch: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Pull per interval"
                value={newRepo.UInt}
                onChange={(e) => setNewRepo({ ...newRepo, UInt: e.target.value })}
              />
              <input
                type="text"
                placeholder="Pull on last push (true or empty)"
                value={newRepo.UlastPush}
                onChange={(e) => setNewRepo({ ...newRepo, UlastPush: e.target.value })}
              />
              <input
                type="text"
                placeholder="Pull with pattern in last commit"
                value={newRepo.UpatCom}
                onChange={(e) => setNewRepo({ ...newRepo, UpatCom: e.target.value })}
              />
              <input
                type="text"
                placeholder="Run command after pull"
                value={newRepo.runCmd}
                onChange={(e) => setNewRepo({ ...newRepo, runCmd: e.target.value })}
              />
              <button onClick={handleAddRepo}>Add</button>
            </div>
          )}
          <button className="toggle-button" onClick={() => setShowTokenSection(!showTokenSection)}>
            {showTokenSection ? 'Hide Token Form' : 'Change Access Token'}
          </button>
          {showTokenSection && (
            <div className="token-form slideIn">
              <h2>Change Access Token</h2>
              <input
                type="text"
                placeholder="Nouveau token"
                value={newToken}
                onChange={handleTokenInputChange}
              />
              <button onClick={handleSaveToken}>Save Token</button>
              <button onClick={handleCreateAccessToken}>Create new Token</button>
            </div>
          )}
          <h2>Statistiques</h2>
          <RepoChart repos={repos} />
        </>
      ) : (
        <>
          <h2>Change Access Token</h2>
          <div className="token-form">
            <input
              type="text"
              placeholder="Nouveau token"
              value={newToken}
              onChange={handleTokenInputChange}
            />
              <button onClick={handleSaveToken}>Save Token</button>
              <button onClick={handleCreateAccessToken}>Create new Token</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;