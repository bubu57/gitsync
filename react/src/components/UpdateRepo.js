import React from 'react';
import { useParams } from 'react-router-dom';

const UpdateRepo = () => {
  const { index } = useParams();

  const handleUpdateNow = () => {
    axios.post(`http://localhost:5000/repos/${index}/update`)
      .then(response => {
        console.log(response.data);
        alert('Mise à jour effectuée avec succès.');
      })
      .catch(error => {
        console.error('Erreur lors de la mise à jour du dépôt:', error);
      });
  };

  return (
    <div>
      <h2>Mettre à jour le dépôt</h2>
      <button onClick={handleUpdateNow}>Mettre à jour maintenant</button>
      {/* Ajoutez ici des options pour la mise à jour automatique */}
      <br />
      <Link to={`/repo/${index}`}>Retour</Link>
    </div>
  );
};

export default UpdateRepo;
