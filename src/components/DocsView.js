import React, { Component } from 'react';
import {Route, IndexRoute} from 'react-router';
import MarkedownView from "./MarkedownView";
import $ from 'n-zepto';

import DocsNav from "./DocsNav";

/* makdown 文章列表 */
var Pages = [];
/* makedown文件根目录 */
var PathRoot = "";

class DocsView extends Component {

	render() {
		return (
			<section className="documentation">
				<div className="site-container">
					<DocsNav items={Pages} root={PathRoot} defaultChild={<span>hello</span>} />
					{this.props.children}
				</div>
			</section>
		);
	}
}

export function getRouter(path, docsList) {
	PathRoot = path + "/";
	Pages    = docsList;

	return (
		<Route path={path} component={DocsView}>
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
	)
}

export default DocsView;