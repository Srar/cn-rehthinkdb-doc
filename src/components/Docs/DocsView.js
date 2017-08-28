import React, { Component } from 'react';
import {Route, IndexRoute} from 'react-router';
import MarkedownView from "../MarkedownView";

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

	var renderDocuments = [];

	Pages.forEach(function(root, rootIndex) {
		if(rootIndex === 0) return null;
		return root.childs.forEach((renderDocument, renderDocumentIndex) => {
            renderDocuments.push(<Route
                path={`${rootIndex}-${renderDocumentIndex}`}
                component={MarkedownView} 
                markdownFileUrl={root.root + renderDocument.path} />);	
            
            if(renderDocument.router != undefined) {
                renderDocuments.push(<Route
                    path={`${renderDocument.router}`}
                    component={MarkedownView} 
                    markdownFileUrl={root.root + renderDocument.path} />);	
            }
		});
	}, this);

	return (
		<Route path={path} component={DocsView}>
			<IndexRoute component={MarkedownView} markdownFileUrl={Pages[0].index} />
            {renderDocuments}
		</Route>
	)
}

export default DocsView;