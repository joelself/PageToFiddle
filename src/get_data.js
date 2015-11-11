function absolutePath(href) {
    var link = document.createElement("a");
    link.href = href;
    return link.protocol + "//" + link.host + link.pathname + link.search + link.hash;
}

function replaceWithAbsoluteLinks(html) {
	var links, link, i, regex;
	links = document.querySelectorAll('[src]');
	for (i = 0; i < links.length; i++) {
		link = links[i].getAttribute('src');
		regex = new RegExp('(\"|\')' + link + '(\"|\')', 'g');
		html = html.replace(regex, '"' + absolutePath(link) + '"');
	}
	links = document.querySelectorAll('[href]');
	for (i = 0; i < links.length; i++) {
		link = links[i].getAttribute('href');
		regex = new RegExp('(\"|\')' + link + '(\"|\')', 'g');
		html = html.replace(regex, '"' + absolutePath(link) + '"');
	}
	return html;
}

function getData() {
	var html, scripts, src, css, i, scriptLinks = [], cssLinks = [], linksMap = {};
	scripts = document.getElementsByTagName('script');
	for (i = 0; i < scripts.length; i++) {
		if (scripts[i].hasAttribute('src')) {
			src = scripts[i].getAttribute('src');
			scriptLinks.push(absolutePath(src));
		}
	}
	css = document.getElementsByTagName('link');
	for (i = 0; i < css.length; i++) {
		if (css[i].hasAttribute('href') &&
				((css[i].hasAttribute('rel') && css[i].getAttribute('rel') == 'stylesheet') ||
					(css[i].hasAttribute('type') && css[i].getAttribute('type') == 'text/css'))) {
			cssLinks.push(absolutePath(css[i].getAttribute('href')));
		}
	}
	html = document.documentElement.outerHTML;
	html = replaceWithAbsoluteLinks(html);
	window.postMessage({'html': html,
						'scriptLinks': scriptLinks,
						'cssLinks': cssLinks}, '*');
}

getData();