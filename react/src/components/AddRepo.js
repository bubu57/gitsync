import React, { useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

const AddRepo = () => {
  const [owner, setOwner] = useState('');
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const history = useHistory();

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/repos', { owner, name, path })
      .then(response => {
        console.log(response.data);
        history.push('/');
      })
      .catch(error => {
        console.error('Erreur lors de l\'ajout du dépôt:', error);
      });
  };

  return (
    <div>
      <h2>Ajouter un dépôt</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Utilisateur :</label>
          <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} required />
        </div>
        <div>
          <label>Nom du dépôt :</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>Chemin local :</label>
          <input type="text" value={path} onChange={(e) => setPath(e.target.value)} required />
        </div>
        <button type="submit">Ajouter</button>
      </form>
    </div>
  );
};

export default AddRepo;
