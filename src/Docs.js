import React, { Component } from 'react';
import {Route, IndexRoute} from 'react-router';
import MarkedownView from "./components/MarkedownView";

import Nav from "./components/ChildNav";

var Pages = [
	{
		root : "/",
		index: "DocsPages/Main.md",
	},
	{
		title: "入门指南",
		root : "/DocsPages/GettingStarted/",
		childs: [
			{ title: "安装 RethinkDB", path: "InstallTheServer.md" },
			{ title: "30秒快速入门", path: "Quickstart.md" },
			{ title: "Install client drivers", path: "Main.md" },
			{ title: "开始使用 RehthinkDB", path: "StartARethinkDBServer.md" },
		]
	},
	{
		title: "ReQL查询",
		root : "/DocsPages/ReQLQuery/",
		childs: [
			{ title: "10分钟快速了解", path: "TenMinuteGuideJS.md" },
			{ title: "了解 ReQL", path: "IntroductionToReQL.md" },
			{ title: "使用索引", path: "UsingSecondaryIndexes.md" },
			{ title: "访问嵌套字段", path: "AccessingNestedFields.md" },
			{ title: "RethinkDB中的表连接", path: "TableJoinsInRethinkDB.md" },
			{ title: "RethinkDB中的Map-reduce", path: "MapReduceInRethinkDB.md" },
			{ title: "Changefeeds", path: "Changefeeds.md" },
			{ title: "HTTP API", path: "HTTPAPI.md" },
			{ title: "ReQL错误类型", path: "ReQLErrorTypes.md" },
			// { title: "API文档", path: "Main.md" },
		]
	},
	{
		title: "RethinkDB数据模型",
		root : "/DocsPages/DataModel/",
		childs: [
			{ title: "ReQL中的数据类型", path: "ReQLDataTypes.md" },
			{ title: "日期与时间", path: "DatesAndTimes.md" },
			{ title: "二进制对象",  path: "BinaryObjects.md" },
			{ title: "Geospatial queries", path: ".md" },
			{ title: "Modeling relationships", path: ".md" },
		]
	}
];

var PathRoot = "";

export function getRouter(path) {
	PathRoot = path + "/";
	return (
		<Route path={path} component={DocsIndex}>
			<IndexRoute component={MarkedownView} url={Pages[0].index} />
			{Pages.map((page, pageIndex) => {
				if(pageIndex === 0) return null;
				return page.childs.map((child, childIndex) => {
					return (
						<Route
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
					<Nav items={Pages} root={PathRoot} defaultChild={<span>hello</span>} />
					{this.props.children}
				</div>
			</section>
		);
	}
}

export default DocsIndex;