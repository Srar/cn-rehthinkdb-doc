import React, { Component } from 'react';
import {Link} from "react-router";

class Nav extends Component {

	constructor(props) {
		super(props);
		this.state = {
			component: this.props["defaultChild"] || <span></span>
		};
	}


	render() {
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
										return (
											<li key={`docs-nav-item-${item.title}-${child.title}`}>
												{/*<Link to={`${itemIndex}-${childIndex}`}>{child.title}</Link>*/}
												<a href={`${itemIndex}-${childIndex}`}>{child.title}</a>

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

export default Nav;