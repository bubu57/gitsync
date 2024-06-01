import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RepoScann = ({ getrepo }) => {
    const [progress, setProgress] = useState(0);
    const [foundRepos, setFoundRepos] = useState([]);
    const [showAlert, setShowAlert] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [selectedRepos, setSelectedRepos] = useState([]);
    const [alertMessage, setAlertMessage] = useState('');
    const [path, setPath] = useState('');
    const [newPath, setNewPath] = useState('');

    const handlePathInputChange = (event) => {
        setNewPath(event.target.value);
    };

    const handleSavePath = () => {
        axios.post('/api/setconfig', { scannpath: newPath })
            .then(response => {
                console.log('Path saved successfully:', response.data);
                setPath(newPath); // Update the path state immediately
                fetchScann(newPath); // Pass the new path to the fetchScann function
            })
            .catch(error => {
                console.error('Error saving path:', error);
            });
    };

    useEffect(() => {
        axios.get('/api/getconfig')
            .then(response => {
                setPath(response.data.scannpath);
                if (response.data.scannpath) {
                    fetchScann(response.data.scannpath); // Use the response path
                }
            })
            .catch(error => {
                console.error('Error retrieving path:', error);
            });
    }, []);

    const fetchScann = async (scanPath) => {
        setScanning(true);
        setProgress(0);

        try {
            const response = await axios.post('/api/scanRepos', { path: scanPath }, {
                onDownloadProgress: (progressEvent) => {
                    if (progressEvent.lengthComputable) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setProgress(percentCompleted);
                    }
                }
            });
            setFoundRepos(response.data.repos);
        } catch (error) {
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
                setAlertMessage('Operation successful');
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 3000);
            } catch (error) {
                console.error('Error adding repository:', error);
            }
        }
    };

    return (
        <div>
            {path ? (
                <>
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
                    {selectedRepos.length > 0 && <button onClick={handleAddSelectedRepos}>Add selected repositories</button>}
                    {showAlert && <p className="alert">{alertMessage}</p>}
                    <p><br /></p>
                    <p>Change scann path</p>
                    <input
                        type="text"
                        placeholder="ex: /home/user"
                        value={newPath}
                        onChange={handlePathInputChange}
                    />
                    <button onClick={handleSavePath}>Save Path</button>
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