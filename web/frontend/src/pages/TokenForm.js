import React, { useState } from 'react';

const TokenForm = ({ onSaveToken, onCreateToken }) => {
  const [newToken, setNewToken] = useState('');

  const handleTokenInputChange = (event) => {
    setNewToken(event.target.value);
  };

  const handleSaveToken = () => {
    onSaveToken(newToken);
    setNewToken('');
  };

  const handleCreateToken = () => {
    onCreateToken();
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
    </div>
  );
};

export default TokenForm;
