import React, { useEffect, useState } from 'react';
import GitHub from 'github-api';
import axios from 'axios';

const Home = () => {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoDetails, setRepoDetails] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [UInt, setUInt] = useState();

  useEffect(() => {
    axios.get('/api/repos')
      .then(response => {
        setRepos(response.data.repos);
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des dépôts :', error);
      });
  }, []);

  const handleRepoClick = (repo) => {
    if (selectedRepo && selectedRepo.name === repo.name) {
      setSelectedRepo(null); // Unselect if already selected
      setRepoDetails(null); // Clear repo details
      setBranches([]); // Clear branches
      setSelectedBranch(''); // Clear selected branch
    } else {
      setSelectedRepo(repo);
      fetchBranches(repo.owner, repo.name);
    }
  };

  const fetchRepoDetails = async (repoOwner, repoName, branch) => {
    try {
      const gh = new GitHub();
      const repo = gh.getRepo(repoOwner, repoName);
      const { data: { name, owner, description, html_url } } = await repo.getDetails();
      const lastCommit = await repo.getBranch(branch);
      const { commit: { author: { name: commitAuthor }, message }, commit: { author: { date } } } = lastCommit.data.commit;
      setRepoDetails({
        name,
        owner: owner.login,
        description,
        url: html_url,
        lastCommitMessage: message,
        lastCommitAuthor: commitAuthor,
        lastCommitDate: new Date(date).toLocaleString()
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du dépôt :', error);
    }
  };

  const fetchBranches = async (repoOwner, repoName) => {
    try {
      const gh = new GitHub();
      const repo = gh.getRepo(repoOwner, repoName);
      const branches = await repo.listBranches();
      setBranches(branches.data);
      setSelectedBranch(branches.data[0].name); // Set default selected branch
      fetchRepoDetails(repoOwner, repoName, branches.data[0].name); // Fetch details for the default branch
    } catch (error) {
      console.error('Erreur lors de la récupération des branches :', error);
    }
  };

  const handleBranchChange = (event) => {
    const branch = event.target.value;
    setSelectedBranch(branch);
    fetchRepoDetails(selectedRepo.owner, selectedRepo.name, branch);
  };

  const handleUIntchnage = (event) => {
    const newUInt = event.target.value;
    setUInt(newUInt);
    console.log(newUInt);
  }

  return (
    <div className="home-container">
      <h2>Liste des Dépôts</h2>
      <ul>
        {repos.map((repo, index) => (
          <li key={index}>
            <a href="#!" onClick={() => handleRepoClick(repo)}>
              {repo.name}
            </a>
            {selectedRepo && selectedRepo.name === repo.name && (
              <div>
                <div>
                  <label htmlFor="branch-select">Sélectionnez une branche :</label>
                  <select
                    id="branch-select"
                    value={selectedBranch}
                    onChange={handleBranchChange}
                  >
                    {branches.map((branch, index) => (
                      <option key={index} value={branch.name}>{branch.name}</option>
                    ))}
                  </select>
                </div>
                {repoDetails && (
                  <div>
                    <h3>Détails du Dépôt: {repoDetails.name}</h3>
                    <p>Propriétaire: {repoDetails.owner}</p>
                    <p>Description: {repoDetails.description}</p>
                    <p>URL: <a href={repoDetails.url}>{repoDetails.url}</a></p>
                    <p>Dernier commit: {repoDetails.lastCommitMessage}</p>
                    <p>Commit par: {repoDetails.lastCommitAuthor}</p>
                    <p>Date du dernier commit: {repoDetails.lastCommitDate}</p>
                    <p>Nombre de commits: {repoDetails.commits}</p>
                    <h3>Parametres</h3>
                    <p>Interval: </p><input type='number' value={UInt} onChange={handleUIntchnage} placeholder={repo.UInt} />


                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;