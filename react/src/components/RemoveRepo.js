import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

const RemoveRepo = () => {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const history = useHistory();

  useEffect(() => {
    axios.get('http://localhost:5000/repos')
      .then(response => {
        setRepos(response.data);
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des dépôts:', error);
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const index = selectedRepo.split('.')[0] - 1;
    axios.delete(`http://localhost:5000/repos/${index}`)
      .then(response => {
        console.log(response.data);
        history.push('/');
      })
      .catch(error => {
        console.error('Erreur lors de la suppression du dépôt:', error);
      });
  };

  return (
    <div>
      <h2>Supprimer un dépôt</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Sélectionnez le dépôt :</label>
          <select value={selectedRepo} onChange={(e) => setSelectedRepo(e.target.value)} required>
            <option value="">Sélectionner...</option>
            {repos.map((repo, index) => (
              <option key={index} value={`${index + 1}. ${repo.owner}/${repo.name}`}>
                {repo.owner}/{repo.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit">Supprimer</button>
      </form>
    </div>
  );
};

export default RemoveRepo;
