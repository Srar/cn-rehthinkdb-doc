import React, { Component } from 'react';
import { Link } from 'react-router'

import RethinkDBIcon from "../../public/DocsPages/images/logo.png";
import MenuIcon from '../../public/DocsPages/images/icon-menu-white.png';

import '../assets/styles/styles.css';
import '../assets/styles/jekyll-github.css';

class App extends Component {

    render() {
        return (
            <div>
                <nav className="site-nav">
                    <div className="site-container">
                        <a className="logo" style={{ backgroundImage: RethinkDBIcon }} href="/">RethinkDB</a>
                        <ul>
                            <li className="menu-trigger">
                                <a href="/"><img className="menu-trigger-icon" src={MenuIcon} role="presentation" /></a>
                            </li>
                            <li className="active">
                                <Link to="/Docs">Docs</Link>
                            </li>
                            <li>
                                <Link to="/Api">Api</Link>
                            </li>
                        </ul>
                    </div>
                </nav>
                {this.props.children}
            </div>
        );
    }
}

export default App;