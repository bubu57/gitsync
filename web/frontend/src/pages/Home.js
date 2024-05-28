import React, { useEffect, useState } from 'react';
import GitHub from 'github-api';
import axios from 'axios';
import Chart from 'chart.js/auto';
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
  const [nbrepos, setNbrepos] = useState(0);
  let [alertmessage, setalertmessage] = useState('');
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
  const [scannedRepos, setScannedRepos] = useState([]); // État pour stocker les dépôts scannés

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

  useEffect(() => {
    if (repos.length === 0) return;

    const ctx = document.getElementById('bar-chart');

    const label = repos.map(repo => repo.name);
    const pulls = repos.map(repo => repo.pull);
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: label,
        datasets: [{
          label: 'Number of Pulls',
          data: pulls,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }, [repos]);

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
  
    axios.post('/api/repos', newRepo)
      .then(response => {
        setRepos([...repos, response.data]); 
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
        setShowAddRepo(false); 
        setalertmessage('Operation successful')
        setShowAlert(true); 
        setTimeout(() => setShowAlert(false), 3000);
      })
      .catch(error => {
        console.error('Error adding repository:', error);
      });
  };

  const handleScanRepos = () => {
    axios.get('/api/scanrepos')
      .then(response => {
        setScannedRepos(response.data.repos);
      })
      .catch(error => {
        console.error('Error scanning repositories:', error);
      });
  };

  const handleScannedRepoClick = (repo) => {
    setNewRepo({
      owner: repo.remoteUrl.split('/')[3], 
      name: repo.name,
      path: repo.path,
      branch: 'main',
      lastCommitSha: '',
      UInt: '',
      UlastPush: '',
      UpatCom: '',
      runCmd: '',
      ntfy: '',
      pull: ''
    });
    setShowAddRepo(true);
  };

  return (
    <div>
      <h2>GitHub Repository Management</h2>
      {showAlert && <div className="alert">{alertmessage}</div>}
      <div className="section-container">
        <div className="section">
          <h3>GitHub Token</h3>
          <p>Token: {token}</p>
          <button onClick={() => setShowTokenSection(!showTokenSection)}>
            {showTokenSection ? 'Hide Token Section' : 'Update Token'}
          </button>
          {showTokenSection && (
            <div>
              <p>Click <button onClick={handleCreateAccessToken}>here</button> to create a new token.</p>
              <input type="text" value={newToken} onChange={handleTokenInputChange} placeholder="Enter new token" />
              <button onClick={handleSaveToken}>Save Token</button>
            </div>
          )}
        </div>
      </div>
      <div className="section-container">
        <div className="section">
          <h3>Repositories ({nbrepos})</h3>
          <button onClick={() => setShowAddRepo(!showAddRepo)}>{showAddRepo ? 'Cancel' : 'Add Repository'}</button>
          <button onClick={handleScanRepos}>Scan Repositories</button>
          {showAddRepo && (
            <div className="add-repo-form">
              <input type="text" value={newRepo.owner} onChange={e => setNewRepo({ ...newRepo, owner: e.target.value })} placeholder="Owner" />
              <input type="text" value={newRepo.name} onChange={e => setNewRepo({ ...newRepo, name: e.target.value })} placeholder="Repository Name" />
              <input type="text" value={newRepo.path} onChange={e => setNewRepo({ ...newRepo, path: e.target.value })} placeholder="Repository Path" />
              <input type="text" value={newRepo.branch} onChange={e => setNewRepo({ ...newRepo, branch: e.target.value })} placeholder="Branch" />
              <input type="text" value={newRepo.lastCommitSha} onChange={e => setNewRepo({ ...newRepo, lastCommitSha: e.target.value })} placeholder="Last Commit SHA" />
              <input type="text" value={newRepo.UInt} onChange={e => setNewRepo({ ...newRepo, UInt: e.target.value })} placeholder="Last Commit Date" />
              <input type="text" value={newRepo.UlastPush} onChange={e => setNewRepo({ ...newRepo, UlastPush: e.target.value })} placeholder="Push Date" />
              <input type="text" value={newRepo.UpatCom} onChange={e => setNewRepo({ ...newRepo, UpatCom: e.target.value })} placeholder="Commit Date" />
              <input type="text" value={newRepo.runCmd} onChange={e => setNewRepo({ ...newRepo, runCmd: e.target.value })} placeholder="Run Command" />
              <input type="text" value={newRepo.ntfy} onChange={e => setNewRepo({ ...newRepo, ntfy: e.target.value })} placeholder="Notification Command" />
              <input type="text" value={newRepo.pull} onChange={e => setNewRepo({ ...newRepo, pull: e.target.value })} placeholder="Number of Pulls" />
              <button onClick={handleAddRepo}>Add Repository</button>
            </div>
          )}
          <ul>
            {repos.map(repo => (
              <li
                key={repo.name}
                className={selectedRepo && selectedRepo.name === repo.name ? 'selected' : ''}
                onClick={() => handleRepoClick(repo)}
              >
                {repo.name}
              </li>
            ))}
          </ul>
          {scannedRepos.length > 0 && (
            <div>
              <h4>Scanned Repositories</h4>
              <ul>
                {scannedRepos.map(repo => (
                  <li key={repo.path} onClick={() => handleScannedRepoClick(repo)}>
                    {repo.name} - {repo.path}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="section">
          <h3>Repository Details</h3>
          {repoDetails && (
            <div>
              <p><strong>Name:</strong> {repoDetails.name}</p>
              <p><strong>Owner:</strong> {repoDetails.owner}</p>
              <p><strong>URL:</strong> <a href={repoDetails.url} target="_blank" rel="noopener noreferrer">{repoDetails.url}</a></p>
              <p><strong>Last Commit:</strong> {repoDetails.lastCommitMessage}</p>
              <p><strong>Author:</strong> {repoDetails.lastCommitAuthor}</p>
              <p><strong>Date:</strong> {repoDetails.lastCommitDate}</p>
              <p><strong>SHA:</strong> {repoDetails.lastCommitSha}</p>
            </div>
          )}
          {selectedRepo && (
            <div>
              <h4>Branches</h4>
              <select value={selectedBranch} onChange={handleBranchChange}>
                {branches.map(branch => (
                  <option key={branch.name} value={branch.name}>{branch.name}</option>
                ))}
              </select>
            </div>
          )}
          {selectedRepo && (
            <div className="update-params">
              <h4>Update Parameters</h4>
              <input type="text" value={updatedParams.branch} onChange={e => handleInputChange(e, 'branch')} placeholder="Branch" />
              <input type="text" value={updatedParams.UInt} onChange={e => handleInputChange(e, 'UInt')} placeholder="Last Commit Date" />
              <input type="text" value={updatedParams.UlastPush} onChange={e => handleInputChange(e, 'UlastPush')} placeholder="Push Date" />
              <input type="text" value={updatedParams.UpatCom} onChange={e => handleInputChange(e, 'UpatCom')} placeholder="Commit Date" />
              <input type="text" value={updatedParams.runCmd} onChange={e => handleInputChange(e, 'runCmd')} placeholder="Run Command" />
              <input type="text" value={updatedParams.ntfy} onChange={e => handleInputChange(e, 'ntfy')} placeholder="Notification Command" />
              <button onClick={handleUpdateParams}>Update Parameters</button>
            </div>
          )}
        </div>
        <div className="section">
          <h3>Pulls</h3>
          <canvas id="bar-chart"></canvas>
        </div>
      </div>
    </div>
  );
};

export default Home;
