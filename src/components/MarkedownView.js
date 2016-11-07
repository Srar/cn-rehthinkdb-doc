import React, { Component } from "react";
import marked from "marked";
import highlight from "highlight.js";
import $ from 'n-zepto';

export default class MarkedownView extends Component {
	constructor(props) {
		super(props);
		this.state = {
			html: "Loading..."
		};
	}

	componentDidMount() {
		if(this.props.url == null && this.props.route.url == null) {
			return
		}

		$.get(this.props.url || this.props.route.url, function(response){
			this.setState({ html: marked(response) });
			$('pre code').each(function(i, block) {
				highlight.highlightBlock(block);
			});
		}.bind(this));
		this.forceUpdate();
	}

	render() {
		console.log(this.props.route.url);
		return (
			<section className="docs-article">
				<div className="docs markdown-view" dangerouslySetInnerHTML={{__html: this.state.html}}></div>
			</section>
		)
	}
}
