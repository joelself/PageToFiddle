var absolutePath = function(href) {
    var link = document.createElement("a");
    link.href = href;
    return (link.protocol+"//"+link.host+link.pathname+link.search+link.hash);
}
function getData() {
	var html, scripts, css, i, scriptLinks = [], cssLinks = [];
	scripts = document.getElementsByTagName('script');
	for(i = 0; i < scripts.length; i++) {
		if(scripts[i].hasAttribute('src')) {
			scriptLinks.push(absolutePath(scripts[i].getAttribute('src')));
		}
	}
	css = document.getElementsByTagName('link');
	for(i = 0; i < css.length; i++) {
		if(css[i].hasAttribute('href') &&
			((css[i].hasAttribute('rel') && css[i].getAttribute('rel') == 'stylesheet') ||
			 (css[i].hasAttribute('type') && css[i].getAttribute('type') == 'text/css'))) {
			cssLinks.push(absolutePath(css[i].getAttribute('href')));
		}
	}
	html = document.documentElement.outerHTML;
	window.postMessage({'html': html,
						'scriptLinks': scriptLinks,
						'cssLinks': cssLinks}, '*');
}

getData();
//# sourceURL=getData.js