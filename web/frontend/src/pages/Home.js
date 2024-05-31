import React, { useEffect, useState, useRef } from 'react';
import GitHub from 'github-api';
import axios from 'axios';
import RepoChart from './RepoChart';
import AddRepoForm from './AddRepoForm';
import TokenForm  from './TokenForm';
import RepoDetails from './RepoDetails';
import './Home.css';

const Home = () => {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoDetails, setRepoDetails] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [token, setToken] = useState('');
  const [updatedParams, setUpdatedParams] = useState({});
  const [showAlert, setShowAlert] = useState(false);
  let [alertmessage, setalertmessage] = useState('');
  const [nbrepos, setNbrepos] = useState(0);
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

  const handleCreateToken  = () => {
    window.location.href = 'https://github.com/settings/tokens/new';
  };

  const handleSaveToken = (newToken) => {
    axios.post('/api/ntoken', { token: newToken })
      .then(response => {
        setToken(newToken);
        setalertmessage('Operation successful');
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
        setalertmessage('Operation successful');
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

  const handleAddRepo = (newRepo) => {
    axios.post('/api/addrepo', newRepo)
      .then(response => {
        setRepos([...repos, newRepo]);
        setalertmessage('Operation successful');
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
                      <RepoDetails
                        repoDetails={repoDetails}
                        selectedBranch={selectedBranch}
                        updatedParams={updatedParams}
                        onBranchChange={handleBranchChange}
                        onInputChange={handleInputChange}
                        onUpdateParams={handleUpdateParams}
                      />
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
          {showAddRepo && <AddRepoForm onAddRepo={handleAddRepo} />}


          <button className="toggle-button" onClick={() => setShowTokenSection(!showTokenSection)}>
            {showTokenSection ? 'Hide Token Form' : 'Change Access Token'}
          </button>
          {showTokenSection && <TokenForm onSaveToken={handleSaveToken} onCreateToken={handleCreateToken} />}


          <h2>Statistiques</h2>
          <RepoChart repos={repos} />
        </>
      ) : (
        <>
          <TokenForm onSaveToken={handleSaveToken} onCreateToken={handleCreateToken} />
        </>
      )}
    </div>
  );
};

export default Home;