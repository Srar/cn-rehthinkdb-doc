import React, { Component } from 'react';
import {Router, Route, browserHistory} from 'react-router';

import RethinkDBIcon from "../public/DocsPages/images/logo.png";
import MenuIcon from '../public/DocsPages/images/icon-menu-white.png';

import './assets/styles/styles.css';
import './assets/styles/jekyll-github.css';

import DocsIndex, {  getRouter as docsGetRouter } from "./Docs/DocsIndex.js";

class App extends Component {
    render() {
    	console.log(docsGetRouter("/"));
		return (
			<div>
				<nav className="site-nav">
					<div className="site-container">
						<a className="logo" style={{backgroundImage: RethinkDBIcon}} href="/">RethinkDB</a>
						<ul>
							<li className="menu-trigger">
								<a href="/"><img className="menu-trigger-icon" src={MenuIcon} role="presentation" /></a></li>
							<li className="active"><a href="/docs">Docs</a></li>
							<li><a href="/api">API</a></li>
						</ul>
					</div>
				</nav>

				<Router onUpdate={() => window.scrollTo(0, 0)} history={browserHistory}>
					{/*<Route path={"/"} component={DocsIndex} >*/}
						{/*<IndexRoute component={DocsIndex} />*/}
						{/*{ docsGetRouter() }*/}
					{/*</Route>*/}

					{ docsGetRouter("/") }

					{/*<Route path={"/"} component={<div><span>root</span></div>} >*/}
						{/*<IndexRoute component={<span>home</span>} />*/}
						{/*<Route path={"user"} component={<span>user</span>} />*/}
						{/*<Route path={"home"} component={<span>home</span>} />*/}
					{/*</Route>*/}

					<Route path="/api" component={DocsIndex}></Route>
				</Router>
			</div>
		);
	}
}

export default App;