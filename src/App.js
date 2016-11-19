import React, { Component } from 'react';
import {Router, browserHistory, Redirect} from 'react-router';

import RethinkDBIcon from "../public/DocsPages/images/logo.png";
import MenuIcon from '../public/DocsPages/images/icon-menu-white.png';

import './assets/styles/styles.css';
import './assets/styles/jekyll-github.css';

import { getRouter as docsGetRouter } from "./components/DocsView.js";

class App extends Component {
    render() {
		return (
			<div>
				<nav className="site-nav">
					<div className="site-container">
						<a className="logo" style={{backgroundImage: RethinkDBIcon}} href="/">RethinkDB</a>
						<ul>
							<li className="menu-trigger">
								<a href="/"><img className="menu-trigger-icon" src={MenuIcon} role="presentation" /></a>
							</li>
							<li className="active"><a href="/docs">Docs</a></li>
							<li><a href="/api">API</a></li>
						</ul>
					</div>
				</nav>

				<Router onUpdate={() => window.scrollTo(0, 0)} history={browserHistory}>
					{ docsGetRouter("/docs", require("./pages/RethinkDBDocs.json")) }
					<Redirect from="/" to="docs" />
				</Router>
			</div>
		);
	}
}

export default App;