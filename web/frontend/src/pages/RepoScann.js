import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RepoScann = ( {  getrepo } ) => {

    const [progress, setProgress] = useState(0);
    const [foundRepos, setFoundRepos] = useState([]);
    const [showAlert, setShowAlert] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [selectedRepos, setSelectedRepos] = useState([]);
    let [alertmessage, setalertmessage] = useState('');

    async function fetchScann () {
        setScanning(true);
        setProgress(0);
        
        try {
          const response = await axios.post('/api/scanRepos', { path: '/home/user' }, {
            onDownloadProgress: (progressEvent) => {
              if (progressEvent.lengthComputable) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setProgress(percentCompleted);
              }
            }
          });
            setFoundRepos(response.data.repos);
        } catch (error) {
            console.error('Erreur lors du scan des dépôts :', error);
        } finally {
            setScanning(false);
        }
    }


    useEffect(() => {
        fetchScann();
    }, [] );
    
    const handleRepoSelect = (repo) => {
        setSelectedRepos(prevSelected => {
            if (prevSelected.includes(repo)) {
                return prevSelected.filter(r => r !== repo);
            } else {
                return [...prevSelected, repo];
            }
        });
    };
    
    const handleAddSelectedRepos = async () => {
        for (const repo of selectedRepos) {
            const newRepo = {
                owner: repo.owner,
                name: repo.name,
                path: repo.path,
                branch: repo.branch,
                lastCommitSha: '',
                UInt: '',
                UlastPush: '',
                UpatCom: '',
                runCmd: '',
                ntfy: '',
                pull: '0'
            };
        
            try {
                await axios.post('/api/addrepo', newRepo);
                getrepo();
                setalertmessage('Operation successful');
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 3000);
            } catch (error) {
                console.error('Error adding repository:', error);
            }
        }
    };

  return (
    <div>
        {scanning && <div>Progress: {progress}%</div>}
        <ul>
        {foundRepos.map((repo, index) => (
            <li key={index}>
            <label>
                <input 
                type="checkbox" 
                checked={selectedRepos.includes(repo)}
                onChange={() => handleRepoSelect(repo)}
                />
                {repo.name} - {repo.owner} - {repo.path} - {repo.branch}
            </label>
            </li>
        ))}
        </ul>
        {selectedRepos.length > 0 && <button onClick={handleAddSelectedRepos}>Ajouter les dépôts sélectionnés</button>}
        {showAlert && <p className="alert">{alertmessage}</p>}
        <p><br/></p>
    </div>
  );
};

export default RepoScann;
