import React, { useEffect, useState } from 'react';
import axios from 'axios';
import RepoDetail from './RepoDetail';

const Home = () => {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);

  useEffect(() => {
    axios.get('/api/repos')
      .then(response => {
        setRepos(response.data.repos);
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des dépôts :', error);
      });
  }, []);

  const handleRepoClick = (repoName) => {
    if (selectedRepo === repoName) {
      setSelectedRepo(null); // Unselect if already selected
    } else {
      setSelectedRepo(repoName);
    }
  };

  return (
    <div className="home-container">
      <h2>Liste des Dépôts</h2>
      <ul>
        {repos.map((repo, index) => (
          <li key={index}>
            <a href="#!" onClick={() => handleRepoClick(repo.name)}>
              {repo.name}
            </a>
            {selectedRepo === repo.name && <RepoDetail repoName={repo.name} />}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
