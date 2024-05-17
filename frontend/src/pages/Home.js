import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import RepoDetail from './RepoDetail';

const Home = () => {
  const [repos, setRepos] = useState([]);

  useEffect(() => {
    axios.get('/api/repos')
      .then(response => {
        setRepos(response.data.repos);
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des dépôts :', error);
      });
  }, []);

  return (
    <div className="home-container">
      <h2>Liste des Dépôts</h2>
      <ul>
        {repos.map((repo, index) => (
          <li key={index}>
            <RepoDetail repos={repo.name}></RepoDetail>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
