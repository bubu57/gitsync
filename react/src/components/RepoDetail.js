import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const RepoDetail = () => {
  const { index } = useParams();
  const [repo, setRepo] = useState(null);
  const [commit, setCommit] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/repos/${index}`)
      .then(response => {
        setRepo(response.data);
      })
      .catch(error => {
        console.error('Erreur lors de la récupération du dépôt:', error);
      });

    axios.get(`http://localhost:5000/repos/${index}/last-commit`)
      .then(response => {
        setCommit(response.data);
      })
      .catch(error => {
        console.error('Erreur lors de la récupération du dernier commit:', error);
      });
  }, [index]);

  if (!repo || !commit) {
    return <div>Chargement...</div>;
  }

  return (
    <div>
      <h2>Informations sur le dépôt {repo.owner}/{repo.name}</h2>
      <p>Description : {repo.description || 'Aucune description'}</p>
      <p>Dernier commit : {commit.message}</p>
      <p>Date et heure du dernier commit : {new Date(commit.date).toLocaleString()}</p>
      <Link to={`/update/${index}`}>Mettre à jour le dépôt</Link>
      <br />
      <Link to="/">Retour</Link>
    </div>
  );
};

export default RepoDetail;
