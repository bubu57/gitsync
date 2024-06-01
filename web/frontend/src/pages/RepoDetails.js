import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GitHub from 'github-api';

const RepoDetails = ({ token, selectedRepo, onAlert }) => {

  const [repoDetails, setRepoDetails] = useState(null);
  const [updatedParams, setUpdatedParams] = useState({});
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    if (selectedRepo) {
      fetchBranches(selectedRepo.owner, selectedRepo.name);
    }
  }, [selectedRepo]);

  useEffect(() => {
    if (selectedRepo && selectedBranch) {
      fetchRepoDetails(selectedRepo.owner, selectedRepo.name, selectedBranch);
    }
  }, [selectedBranch, selectedRepo]);

  async function fetchBranches(repoOwner, repoName) {
    try {
      const gh = new GitHub({ token: token });
      const repo = gh.getRepo(repoOwner, repoName);
      const branches = await repo.listBranches();
      setBranches(branches.data);
      setSelectedBranch(branches.data[0].name); 
    } catch (error) {
      onAlert('Error fetching branches', 'error');
      console.error('Error fetching branches:', error);
    }
  }

  const handleUpdateParams = () => {
    const updatedRepo = { ...selectedRepo, ...updatedParams };
    axios.post('/api/updateRepoParams', updatedRepo)
      .then(response => {
        fetchBranches(updatedRepo.owner, updatedRepo.name);
        onAlert('Repository parameters updated successfully', 'success');
      })
      .catch(error => {
        onAlert('Error updating repository parameters', 'error');
        console.error('Error updating repository parameters:', error);
      });
  };

  const onInputChange = (event, parameter) => {
    const value = event.target.value;
    setUpdatedParams(prevParams => ({ ...prevParams, [parameter]: value }));
  };

  useEffect(() => {
    if (selectedRepo) {
      const { branch, UInt, UlastPush, UpatCom, runCmd, ntfy } = selectedRepo;
      setUpdatedParams({ branch, UInt, UlastPush, UpatCom, runCmd, ntfy });
    }
  }, [selectedRepo]);

  const fetchRepoDetails = async (repoOwner, repoName, branch) => {
    try {
      const gh = new GitHub({ token: token });
      const repo = gh.getRepo(repoOwner, repoName);
      const repodata = await repo.getDetails();
      const lastCommit = await repo.getBranch(branch);
      setRepoDetails({
        name: repodata.data.name,
        owner: repodata.data.owner.login,
        url: repodata.data.html_url,
        lastCommitMessage: lastCommit.data.commit.commit.message,
        lastCommitAuthor: lastCommit.data.commit.author.login,
        lastCommitDate: new Date(lastCommit.data.commit.commit.author.date).toLocaleString(),
        lastCommitSha: lastCommit.data.commit.sha
      });
    } catch (error) {
      onAlert('Error fetching repository details', 'error');
      console.error('Error fetching repository details:', error);
    }
  };

  const handleBranchChange = (event) => {
    const branch = event.target.value;
    setSelectedBranch(branch);
  };

  return (
    <div className="repo-details slideIn">
      <div>
        <label htmlFor="branch-select">Select a branch:</label>
        <select
          id="branch-select"
          value={selectedBranch}
          onChange={handleBranchChange}
        >
          {branches.map((branchl, index) => (
            <option key={index} value={branchl.name}>{branchl.name}</option>
          ))}
        </select>
      </div>
      {repoDetails && (
        <div>
          <h3>Repository Details: {repoDetails.name}</h3>
          <p><b>Owner:</b> {repoDetails.owner}</p>
          <p><b>URL:</b> <a href={repoDetails.url}>{repoDetails.url}</a></p>
          <p><b>Last commit:</b> {repoDetails.lastCommitMessage}</p>
          <p><b>Commit by:</b> {repoDetails.lastCommitAuthor}</p>
          <p><b>Date of last commit:</b> {repoDetails.lastCommitDate}</p>
          <h3>Parameters</h3>
          <div className="input-group">
            <label htmlFor="Branch-input">Branch to be updated</label>
            <input 
              type="text" 
              id="Branch-input"
              value={updatedParams.branch} 
              onChange={(event) => onInputChange(event, 'branch')}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="UInt-input">Pull per interval:</label>
            <input 
              type="text" 
              id="UInt-input"
              value={updatedParams.UInt} 
              onChange={(event) => onInputChange(event, 'UInt')} 
            />
          </div>

          <div className="input-group">
            <label htmlFor="UlastPush-input">Pull on last push (true or empty):</label>
            <input
              type="text" 
              id="UlastPush-input"
              value={updatedParams.UlastPush} 
              onChange={(event) => onInputChange(event, 'UlastPush')} 
            />
          </div>

          <div className="input-group">
            <label htmlFor="UpatCom-input">Pull with pattern in last commit:</label>
            <input 
              type="text" 
              id="UpatCom-input"
              value={updatedParams.UpatCom} 
              onChange={(event) => onInputChange(event, 'UpatCom')} 
            />
          </div>

          <div className="input-group">
            <label htmlFor="runCmd-input">Run command after pull:</label>
            <input 
              type="text" 
              id="runCmd-input"
              value={updatedParams.runCmd} 
              onChange={(event) => onInputChange(event, 'runCmd')} 
            />
          </div>

          <div className="input-group">
            <label htmlFor="runCmd-input">Notification topic if you want to be alerted of a repo update</label>
            <input 
              type="text" 
              id="ntfy-input"
              value={updatedParams.ntfy} 
              onChange={(event) => onInputChange(event, 'ntfy')}
            />
          </div>
          <button onClick={handleUpdateParams}>Save Parameters</button>
        </div>
      )}
    </div>
  );
};

export default RepoDetails;