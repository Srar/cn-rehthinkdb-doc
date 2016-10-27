import React, { Component } from 'react';
import {Route, IndexRoute} from 'react-router';
import MarkedownView from "../Share/MarkedownView";

import Nav from "./Nav";

const Pages = [
	{
		index: "DocsPages/Main.md",
	},
	{
		title: "入门指南",
		root : "DocsPages/GettingStarted/",
		childs: [
			{ title: "安装 RethinkDB", path: "InstallTheServer.md" },
			{ title: "30秒快速入门", path: "Quickstart.md" },
			{ title: "Install client drivers", path: "Main.md" },
			{ title: "开始使用 RehthinkDB", path: "StartARethinkDBServer.md" },
		]
	},
	{
		title: "The ReQL query language",
		root : "DocsPages/ReQLQuery/",
		childs: [
			{ title: "Ten-minute guide", path: "Main.md" },
			{ title: "Introduction to ReQL", path: "Main.md" },
			{ title: "Using secondary indexes", path: "Main.md" },
			{ title: "Accessing nested fields", path: "Main.md" },
			{ title: "Table joins in RethinkDB", path: "Main.md" },
			{ title: "Map-reduce in RethinkDB", path: "Main.md" },
			{ title: "Changefeeds", path: "Main.md" },
			{ title: "Asynchronous connections", path: "Main.md" },
			{ title: "Accessing HTTP APIs", path: "Main.md" },
			{ title: "ReQL error types", path: "Main.md" },
			{ title: "API command reference", path: "Main.md" },
		]
	}
];

export function getRouter(path) {
	return (
		<Route path={path} component={DocsIndex}>
			<IndexRoute component={MarkedownView} url={Pages[0].index} />
			{Pages.map((page, pageIndex) => {
				if(pageIndex === 0) return null;
				return page.childs.map((child, childIndex) => {
					return (
						<Route
							key={`${pageIndex}-${childIndex}`}
							path={`${pageIndex}-${childIndex}`}
							url={page.root + child.path}
							component={MarkedownView} />
					)
				});
			})}
		</Route>
	);
}


class DocsIndex extends Component {

	render() {
		return (
			<section className="documentation">
				<div className="site-container">
					<Nav items={Pages} defaultChild={<span>hello</span>} />
					{this.props.children}
				</div>
			</section>
		);
	}
}

export default DocsIndex;