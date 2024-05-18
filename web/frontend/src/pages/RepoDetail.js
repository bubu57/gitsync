import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import github from 'github-api';

const RepoDetail = (repoName, repoOwner) => {
  const { name } = useParams();
  const [repo, setRepo] = useState(null);

  // Afficher les informations du dépôt et le dernier commit
  const showLastCommit = async () => {
    const gh = new github();
    const repoInstance = gh.getRepo(repoOwner, repoName);
    try {
      const repoDetails = await repoInstance.getDetails();
      const commits = await repoInstance.listCommits();
      const latestCommit = commits.data[0];

      console.log(`\nInformations sur le dépôt ${repoOwner}/${repoName}:`);
      console.log(`Description : ${repoDetails.data.description || 'Aucune description'}`);
      console.log(`URL : ${repoDetails.data.html_url}`);
      console.log(`Dernier commit : ${latestCommit.commit.message}`);
      console.log(`Date et heure du dernier commit : ${new Date(latestCommit.commit.author.date).toLocaleString()}\n`);
    } catch (error) {
      console.error('Erreur lors de la récupération des informations du dépôt:', error);
    }
  };


  if (!repoName) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="repo-detail">
      <h2>Détails du Dépôt: {repoName}</h2>
      <p>Propriétaire: {repoName}</p>
      <p>Chemin: {repoName}</p>
    </div>
  );
};

export default RepoDetail;
