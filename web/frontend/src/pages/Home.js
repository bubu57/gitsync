import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import RepoChart from './RepoChart';
import TokenForm  from './TokenForm';
import RepoDetails from './RepoDetails';
import RepoScann from './RepoScann';
import './Home.css';

const Home = () => {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [token, setToken] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertmessage, setalertmessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [nbrepos, setNbrepos] = useState(0);
  const [showTokenSection, setShowTokenSection] = useState(false);
  const [ShowScannRepo, setShowScannRepo] = useState(false);

  function alert (message, type) {
    setalertmessage(message);
    setAlertType(type); 
    setShowAlert(true); 
    setTimeout(() => setShowAlert(false), 3000);
  }

  const getrepo = async () => {
    if (token) {
      axios.get('/api/repos', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => {
          setRepos(response.data.repos);
          setNbrepos(response.data.repos.length);
        })
        .catch(error => {
          alert('Error fetching repositories', 'error');
          console.error('Error fetching repositories:', error);
        });
    }
  }

  useEffect(() => {
    axios.get('/api/token')
      .then(response => {
        setToken(response.data.token);
      })
      .catch(error => {
        alert('Erreur lors de la récupération du token', 'error');
        console.error('Erreur lors de la récupération du token :', error);
      });
  }, []);

  useEffect(() => {
    getrepo();
  }, [token]);

  const handleRepoClick = (repo) => {
    setSelectedRepo(selectedRepo === repo ? null : repo);
  };

  const handleDeleteRepo = (repoName) => {
    axios.post('/api/delrepo', { name: repoName })
      .then(response => {
        const updatedRepos = repos.filter(repo => repo.name !== repoName);
        setRepos(updatedRepos);
        alert('Repo deleted successfully', 'success');
        getrepo();
      })
      .catch(error => {
        alert('Error deleting repository', 'error');
        console.error('Error deleting repository:', error);
      });
  };


  return (
    <div className="home-container">
      <h2>Repositories {nbrepos}</h2>
      {showAlert && <p className={`alert ${alertType}`}>{alertmessage}</p>}
      {token ? (
        <>
          <ul>
            {repos.map((repo, index) => (
              <li key={index} className="fadeIn">
                <a href="#!" onClick={() => handleRepoClick(repo)}>
                  {repo.name}
                </a>
                <button onClick={() => handleDeleteRepo(repo.name)}>Delete</button>
                {selectedRepo === repo && (
                  <div>
                    <RepoDetails token={token} selectedRepo={selectedRepo} onAlert={alert} />
                  </div>
                )}
              </li>
            ))}
          </ul>


          <button className="toggle-button" onClick={() => setShowScannRepo(!ShowScannRepo)}>
            {ShowScannRepo ? 'Close scan' : 'Scan repo'}
          </button>
          {ShowScannRepo && <RepoScann getrepo={getrepo} onAlert={alert} />}


          <button className="toggle-button" onClick={() => setShowTokenSection(!showTokenSection)}>
            {showTokenSection ? 'Hide Token Form' : 'Change Access Token'}
          </button>
          {showTokenSection && <TokenForm onAlert={alert} />}


          <h2>Statistics</h2>
          <RepoChart repos={repos} onAlert={alert} />
        </>
      ) : (
        <>
          <TokenForm onAlert={alert} />
        </>
      )}
    </div>
  );
};

export default Home;