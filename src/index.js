import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, hashHistory, IndexRedirect } from 'react-router'

import App from "./components/App";
import { getRouter as getRouterOfDocsView } from "./components/Docs/DocsView.js";
import ApiView  from "./components/Api/ApiView.js";

ReactDOM.render(
	<Router history={hashHistory} onUpdate={() => window.scrollTo(0, 0)}>
		<Route path="/" component={App}>
			<IndexRedirect to="/Docs" />
			{ getRouterOfDocsView("Docs", require("./pages/RethinkDBDocs.json")) }
			<Route path="Api" component={ApiView}/>
		</Route>
	</Router>,
	document.getElementById('root')
);