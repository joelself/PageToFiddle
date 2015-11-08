chrome.runtime.onInstalled.addListener(function () {
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
	    chrome.declarativeContent.onPageChanged.addRules([
	        {
	            conditions: [
					new chrome.declarativeContent.PageStateMatcher({
						pageUrl: { schemes: ['http', 'https'] }
					})
				],
				actions: [ new chrome.declarativeContent.ShowPageAction() ]
			}
	    ]);
	});
});

chrome.pageAction.onClicked.addListener(function (tab) {
	chrome.tabs.executeScript(tab.id, {
		code : 'window.postMessage({\'html\': document.documentElement.outerHTML}, \'*\');\n//# sourceURL=getHTML.js\n'
	},
		function () {
			if (chrome.runtime.lastError) {
				return;
			}
		});
});

function getScriptLinks(scripts) {
	var hrefs = [];
	$(scripts).each(function (index) {
		hrefs.push(this.src);
	});
	return hrefs;
}

function getCssLinks(css) {
	var hrefs = [];
	$(css).each(function (index) {
		hrefs.push(this.href);
	});
	return hrefs;
}

function extractInlineScript(scripts) {
	var replaced = {}, code, AST, AST_vars, AST_other, i, j, k, varcode, othercode, keys, allscript, options;
	$(scripts).each(function (index) {
		code = $(this).html();
		AST = parse(code, false, false);
		AST_vars = $.extend(true, [], AST);
		AST_other = $.extend(true, [], AST);
		for (i = 0, j = 0, k = 0; i < AST[1].length; i++) {
			if (AST[1][i][0] == 'var') {
				AST_other.splice(j, 1);
				k++;
			} else {
				AST_vars.splice(k, 1);
				j++;
			}
		}
		options = {indent_start: 0, indent_level: 4, quote_keys: false, space_colon: false, beautify: true, ascii_only: false, inline_script: false};
		varcode = gen_code(AST_vars, options);
		othercode = gen_code(AST_other, options);
		varcode.replace('var ', ''); // this will turn them into global variables
		replaced[index] = varcode + '\n' + othercode;
		$(this).html('inline_func_' + index + '();');
	});
	keys = Object.keys(replaced);
	for (i = 0; i < keys.length; i++) {
		allscript += 'inline_func_' + keys[i] + '() {\n' + replaced[keys[i]] + '\n}\n';
	}
	return allscript;
}

function pageToFiddle(request, sender) {
	var html, dom, script, extScript, styles, css, scriptHrefs, cssHrefs, fullStyle, replaceScripts, externResources, i, keepScripts;
	html = request.html;
	dom = $.parseHTML(html, keepScripts = true);
	script = $(dom).find('script:not([src])');
	extScript = $(dom).detach('script[src]');
	styles = $(dom).detach('style');
	css = $(dom).detach('link[rel="stylesheet"][href],link[type="text/css"][href]');
	replaceScripts = extractInlineScript(script);
	scriptHrefs = getScriptLinks(extScript);
	cssHrefs = getCssLinks(css);
	for (i = 0; i < scriptHrefs.length; i++) {
		if (i == scriptHrefs.length - 1 && cssHrefs.length == 0) {
			externResources += scriptHrefs[i];
		} else {
			externResources += scriptHrefs[i] + ', ';
		}
	}
	for (i = 0; i < cssHrefs.length; i++) {
		if (i == cssHrefs.length - 1) {
			externResources += cssHrefs[i];
		} else {
			externResources += cssHrefs[i] + ', ';
		}
	}
	$(styles).each(function (index) {
		fullStyle += $(this).html() + '\n';
	});
	chrome.tabs.create({index: sender.tab.index + 1,
						active: true,
						openerTabId: sender.tab.id,
						url: "http://jquery.com/"},
						function (tab) {
			chrome.tabs.executeScript(tab.id, {
				code : '$.post("http://jsfiddle.net/api/post/library/pure/",' +
						'{html: $("<p>").append($(dom)).html(),' +
						'js: replaceScripts,' +
						'css: fullStyle,' +
						'panel_html: 0,' +
						'panel_js: 0,' +
						'panel_css: 0,' +
						'resources: externResources,' +
						'title: sender.tab.title + " fiddle",' +
						'description: "Fiddle generated from " + sender.tab.url,' +
						'normalize_css: "no",' +
						'dtd: "HTML 5",' +
						'wrap: "h"}, ' +
						'function (data) {' +
						'	console.log(data);' +
						'});'
			},
							function () {
					if (chrome.runtime.lastError) {
						return;
					}
				});
		});

}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.action === 'pageToFiddle') {
		pageToFiddle(request, sender);
	}
});