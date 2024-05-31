import React from 'react';

const RepoDetails = ({ repoDetails, selectedBranch, updatedParams, onBranchChange, onInputChange, onUpdateParams }) => {
  return (
    <div className="repo-details slideIn">
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
            <label htmlFor="UInt-input">Branch to be updated</label>
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
          <button onClick={onUpdateParams}>Save Parameters</button>
        </div>
      )}
    </div>
  );
};

export default RepoDetails;
