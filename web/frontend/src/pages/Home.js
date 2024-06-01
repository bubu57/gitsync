import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import RepoChart from './RepoChart';
import AddRepoForm from './AddRepoForm';
import TokenForm  from './TokenForm';
import RepoDetails from './RepoDetails';
import RepoScann from './RepoScann';
import './Home.css';

const Home = () => {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [token, setToken] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  let [alertmessage, setalertmessage] = useState('');
  const [nbrepos, setNbrepos] = useState(0);
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [showTokenSection, setShowTokenSection] = useState(false);
  const [ShowScannRepo, setShowScannRepo] = useState(false);

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
        setalertmessage('Operation successful')
        setShowAlert(true); 
        setTimeout(() => setShowAlert(false), 1000);
        getrepo();
      })
      .catch(error => {
        console.error('Error deleting repository:', error);
      });
  };


  return (
    <div className="home-container">
      <h2>Repository {nbrepos}</h2>
      {showAlert && <p className="alert">{alertmessage}</p>}
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
                    <RepoDetails token={token} selectedRepo={selectedRepo} />
                  </div>
                )}
              </li>
            ))}
          </ul>


          <button className="toggle-button" onClick={() => setShowScannRepo(!ShowScannRepo)}>
            {ShowScannRepo ? 'Close scann' : 'Scanner les dépôts GitHub'}
          </button>
          {ShowScannRepo && <RepoScann getrepo={getrepo} />}


          <button className="toggle-button" onClick={() => setShowAddRepo(!showAddRepo)}>
            {showAddRepo ? 'Hide Repository Addition Form' : 'Add a New Repository'}
          </button>
          {showAddRepo && <AddRepoForm getrepo={getrepo} />}


          <button className="toggle-button" onClick={() => setShowTokenSection(!showTokenSection)}>
            {showTokenSection ? 'Hide Token Form' : 'Change Access Token'}
          </button>
          {showTokenSection && <TokenForm />}


          <h2>Statistiques</h2>
          <RepoChart repos={repos} />
        </>
      ) : (
        <>
          <TokenForm />
        </>
      )}
    </div>
  );
};

export default Home;