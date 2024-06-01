import React, { useState } from 'react';
import axios from 'axios';

const AddRepoForm = ( {  getrepo, onAlert} ) => {
  const [repos, setRepos] = useState([]);
  const [newRepo, setNewRepo] = useState({
    owner: '',
    name: '',
    path: '',
    branch: '',
    UInt: '',
    UlastPush: '',
    UpatCom: '',
    runCmd: '',
    ntfy: '',
    pull: '0'
  });

  const handleInputChange = (event, parameter) => {
    const value = event.target.value;
    setNewRepo(prevRepo => ({ ...prevRepo, [parameter]: value }));
  };

  const handleAddRepo = () => {
    if (!newRepo.owner || !newRepo.name || !newRepo.path || !newRepo.branch) {
      onAlert('Please fill in all fields', 'error');
      return;
    }
    axios.post('/api/addrepo', newRepo)
      .then(response => {
        setRepos([...repos, newRepo]);
        setNewRepo({
          owner: '',
          name: '',
          path: '',
          branch: '',
          lastCommitSha: '',
          UInt: '',
          UlastPush: '',
          UpatCom: '',
          runCmd: '',
          ntfy: '',
          pull: ''
        });
        getrepo();
        onAlert('Repository added successfully', 'success');
      })
      .catch(error => {
        onAlert('Error adding repository', 'error');
        console.error('Error adding repository:', error);
      });
  };

  return (
    <div className="add-repo-form slideIn">
      <h2>Add a New Repository</h2>
      <input
        type="text"
        placeholder="Owner"
        value={newRepo.owner}
        onChange={(e) => handleInputChange(e, 'owner')}
        required
      />
      <input
        type="text"
        placeholder="Name"
        value={newRepo.name}
        onChange={(e) => handleInputChange(e, 'name')}
        required
      />
      <input
        type="text"
        placeholder="Path"
        value={newRepo.path}
        onChange={(e) => handleInputChange(e, 'path')}
        required
      />
      <input
        type="text"
        placeholder="Branch"
        value={newRepo.branch}
        onChange={(e) => handleInputChange(e, 'branch')}
        required
      />
      <input
        type="text"
        placeholder="Pull per interval"
        value={newRepo.UInt}
        onChange={(e) => handleInputChange(e, 'UInt')}
      />
      <input
        type="text"
        placeholder="Pull on last push (true or empty)"
        value={newRepo.UlastPush}
        onChange={(e) => handleInputChange(e, 'UlastPush')}
      />
      <input
        type="text"
        placeholder="Pull with pattern in last commit"
        value={newRepo.UpatCom}
        onChange={(e) => handleInputChange(e, 'UpatCom')}
      />
      <input
        type="text"
        placeholder="Run command after pull"
        value={newRepo.runCmd}
        onChange={(e) => handleInputChange(e, 'runCmd')}
      />
      <button onClick={handleAddRepo}>Add</button>
    </div>
  );
};

export default AddRepoForm;
