import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const RepoDetail = (repos) => {
  const { name } = useParams();
  const [repo, setRepo] = useState(null);


  if (!repo) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="repo-detail">
      <h2>Détails du Dépôt: {repos}</h2>
      <p>Propriétaire: {repo.owner}</p>
      <p>Chemin: {repo.path}</p>
    </div>
  );
};

export default RepoDetail;
