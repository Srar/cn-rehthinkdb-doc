import React, { Component } from "react";
import marked from "marked";
import highlight from "highlight.js";
import $ from 'n-zepto';

export default class MarkedownView extends Component {
	constructor(props) {
		super(props);
		this.state = {
			html: "Loading...",
			lastUrl: null
		};
	}


	loadMarkdown() {
		var url = this.props.markdownFileUrl || this.props.route.markdownFileUrl;
		if(url === undefined || url === null) {
			url = "";
			return;
		}

		if(this.state.lastUrl === url) {
			return;
		}

		this.setState({
			html: "Loading...",
			lastUrl: url
		});

		$.get(url, function(response){
			this.setState({ html: marked(response) });
			$('pre code').each(function(i, block) {
				highlight.highlightBlock(block);
			});
		}.bind(this));
	}

	render() {
		this.loadMarkdown();
		return (
			<section className="docs-article">
				<div className="docs markdown-view" dangerouslySetInnerHTML={{__html: this.state.html}}></div>
			</section>
		)
	}
}
