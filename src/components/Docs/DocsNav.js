import React, { Component } from 'react';
import { Link } from 'react-router'

class DocsNav extends Component {

	constructor(props) {
		super(props);
		this.state = {
			component: this.props["defaultChild"] || <span></span>,
			selectedPage: ""
		};


	}

	isUrl(path) {
		if(path.length < 6) {
			return false;
		}

		if(path.substring(0, 7) === "http://" || path.substring(0, 8) === "https://") {
			return true;
		}

		return false;
	}

	render() {
		var _this = this;
		return (
			<section className="docs-sidebar-left">
				<nav className="docs-nav">
					{this.props.items.map((item, itemIndex) => {
						if(itemIndex === 0) return null;
						return (
							<section key={`docs-nav-item-${item.title}`}>
								<h1><a href="#">{item.title}</a></h1>
								<ul className="expanded">
									{item.childs.map((child, childIndex) => {
										var display = child.display === undefined ? true : false;
										if(!display) {
											return null;
										}

										return (
											<li key={`docs-nav-item-${item.title}-${child.title}`} 
											    style={child.style ? child.style : {}}
												className={ this.state.selectedPage == child.path ? "active" : "" } >
												{	
													_this.isUrl(child.path) ? 
													<a href={child.path}>{child.title}</a>:
													<Link to={`${this.props.root || ""}${itemIndex}-${childIndex}`}
													      onClick={ () => this.setState({ selectedPage: child.path })}>{child.title}</Link>
												}
											</li>
										)
									})}
								</ul>
							</section>
						);
					})}
				</nav>
			</section>
		);
	}
}

export default DocsNav;