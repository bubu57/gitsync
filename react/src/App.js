import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import RepoList from './components/RepoList';
import RepoDetail from './components/RepoDetail';
import AddRepo from './components/AddRepo';
import RemoveRepo from './components/RemoveRepo';
import UpdateRepo from './components/UpdateRepo';
import './App.css';

function App() {
  const [repos, setRepos] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/repos')
      .then(response => {
        setRepos(response.data);
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des dépôts:', error);
      });
  }, []);

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>GitSync</h1>
          <nav>
            <ul>
              <li><Link to="/">Liste des dépôts</Link></li>
              <li><Link to="/add">Ajouter un dépôt</Link></li>
              <li><Link to="/remove">Supprimer un dépôt</Link></li>
            </ul>
          </nav>
        </header>
        <main>
          <Switch>
            <Route exact path="/">
              <RepoList repos={repos} />
            </Route>
            <Route path="/repo/:index" component={RepoDetail} />
            <Route path="/add" component={AddRepo} />
            <Route path="/remove" component={RemoveRepo} />
            <Route path="/update/:index" component={UpdateRepo} />
          </Switch>
        </main>
      </div>
    </Router>
  );
}

export default App;
