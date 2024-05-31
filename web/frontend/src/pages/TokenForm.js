import React, { useState } from 'react';
import axios from 'axios';

const TokenForm = ({ onSaveToken, onCreateToken }) => {
  const [newToken, setNewToken] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  let [alertmessage, setalertmessage] = useState('');

  const handleTokenInputChange = (event) => {
    setNewToken(event.target.value);
  };

  const handleSaveToken = () => {
    axios.post('/api/ntoken', { token: newToken })
      .then(response => {
        setalertmessage('Operation successful');
        setShowAlert(true); 
        setTimeout(() => setShowAlert(false), 500);
        window.location.reload();
      })
      .catch(error => {
        console.error('Error saving token:', error);
      });
  };

  const handleCreateToken  = () => {
    window.location.href = 'https://github.com/settings/tokens/new';
  };

  return (
    <div className="token-form slideIn">
      <h2>Change Access Token</h2>
      <input
        type="text"
        placeholder="New token"
        value={newToken}
        onChange={handleTokenInputChange}
      />
      <button onClick={handleSaveToken}>Save Token</button>
      <button onClick={handleCreateToken}>Create New Token</button>
      {showAlert && <p className="alert">{alertmessage}</p>}
    </div>
  );
};

export default TokenForm;
