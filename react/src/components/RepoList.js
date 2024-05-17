import React from 'react';
import { Link } from 'react-router-dom';

const RepoList = ({ repos }) => {
  return (
    <div>
      <h2>Liste des dépôts</h2>
      <ul>
        {repos.map((repo, index) => (
          <li key={index}>
            <Link to={`/repo/${index}`}>{repo.owner}/{repo.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RepoList;
