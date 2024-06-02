import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RepoScann = ({ getrepo, onAlert }) => {
    const [foundRepos, setFoundRepos] = useState([]);
    const [scanning, setScanning] = useState(false);
    const [selectedRepos, setSelectedRepos] = useState([]);
    const [path, setPath] = useState('');
    const [newPath, setNewPath] = useState('');
    const [showChangePath, setShowChangePath] = useState(false);

    const handlePathInputChange = (event) => {
        setNewPath(event.target.value);
    };

    const handleSavePath = () => {
        axios.post('/api/setconfig', { scannpath: newPath })
            .then(response => {
                onAlert('Path saved successfully', 'success');
                setPath(newPath);
                fetchScann(newPath);
            })
            .catch(error => {
                onAlert('Error saving path', 'error');
                console.error('Error saving path:', error);
            });
    };

    const start_scann = () => {
        axios.get('/api/getconfig')
            .then(response => {
                setPath(response.data.scannpath);
                if (response.data.scannpath) {
                    fetchScann(response.data.scannpath);
                }
            })
            .catch(error => {
                onAlert('Error retrieving path', 'error');
                console.error('Error retrieving path:', error);
            });
    }

    useEffect(() => {
        start_scann();
    }, []);

    const fetchScann = async (scanPath) => {
        setScanning(true);

        try {
            const response = await axios.post('/api/scanRepos', { path: scanPath }, {});
            setFoundRepos(response.data.repos);
        } catch (error) {
            onAlert('Error scanning repositories', 'error');
            console.error('Error scanning repositories:', error);
        } finally {
            setScanning(false);
        }
    };

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
                onAlert('Repository added successfully', 'success');
            } catch (error) {
                onAlert('Error adding repository', 'error');
                console.error('Error adding repository:', error);
            }
        }
    };

    const handleStartScann = () => {
        start_scann();
    };

    return (
        <div>
            {path ? (
                <>
                    {scanning && <div>Scaning...</div>}
                    <button className='txt-button' onClick={handleStartScann}>Refresh scann</button>

                    <button className='txt-button' onClick={() => setShowChangePath(!showChangePath)}>
                        {showChangePath ? 'Close' : 'Change scann path'}
                    </button>
                    {showChangePath &&
                        <div>
                            <p>Change scann path</p>
                            <input
                                type="text"
                                placeholder="ex: /home/user"
                                value={newPath}
                                onChange={handlePathInputChange}
                            />
                            <button onClick={handleSavePath}>Save Path</button>
                            <p><br /></p>
                        </div>
                    }

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
                    {selectedRepos.length > 0 && <button onClick={handleAddSelectedRepos}>Add selected repositories</button>}
                    <p><br /></p>
                </>
            ) : (
                <>
                    <p>Enter the starting path where the scan will begin</p>
                    <input
                        type="text"
                        placeholder="ex: /home/user"
                        value={newPath}
                        onChange={handlePathInputChange}
                    />
                    <button onClick={handleSavePath}>Save Path</button>
                    <p><br /></p>
                </>
            )}
        </div>
    );
};

export default RepoScann;