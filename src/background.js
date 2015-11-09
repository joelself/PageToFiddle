chrome.browserAction.onClicked.addListener(function (tab) {
	chrome.tabs.executeScript(tab.id, {
		file : 'get_data.js'
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
function gatherVars(node, varNodes) {
	var i;
	for (i = 0; i < node.length;) {
		if (node[i] != undefined && node[i].constructor === Array) {
			if (node[i][0] === 'var') {
				varNodes.push(node[i]);
				node.splice(i, 1);
			} else {
				if (node[i][0] !== 'function' && node[i][0] !== 'defun') {
					gatherVars(node[i], varNodes);
				}
				i++;
			}
		}
		else {
			i++;
		}
	}
}

function extractInlineScript(scripts) {
	var replaced = [], code, AST, AST_vars, i, varcode, keys, allscript, options, varNodes;
	$(scripts).each(function (index) {
		code = $(this).html();
		try {
			AST = parse(code, false, false);
			varNodes = [];
			gatherVars(AST, varNodes);
			AST_vars = ["toplevel", []];
			for(i = varNodes.length - 1; i >= 0; i--) {
				AST_vars[1].splice(0, 0, varNodes[i]);
			}
			options = {indent_start: 0, indent_level: 4, quote_keys: false, space_colon: false, beautify: true, ascii_only: false, inline_script: false};
			othercode = gen_code(AST, options);
			varcode = gen_code(AST_vars, options);
			//varcode = varcode.replace('var ', ''); // this will turn them into global variables
			replaced.push(othercode);
			$(this).html(varcode + '\nfiddle_func_' + index + '();');
		} catch(e) {
			replaced.push("// An exception was thrown when parsing this code. Global variables weren't made global\n" + code);
			$(this).html('fiddle_func_' + index + '();');
		}
	});
	allscript = '';
	for (i = 0; i < replaced.length; i++) {
		allscript += 'inline_func_' + i + '() {\n' + replaced[i] + '\n}\n';
	}
	return allscript;
}

function getAllStyles(styles) {
	var allStyles = '';
	$(styles).each(function (index) {
		allStyles += $(this).html() + '\n\n';
	});
	return allStyles;
}

function pageToFiddle(request, sender) {
	var html, dom, script, extScript, styles, css, scriptHrefs, cssHrefs, fullStyle, replaceScripts, externResources = '', i, keepScripts, matches;
	html = request.html;
	matches = /(<html)(.*?>[^]*?)(<head)([^]*?>[^]*?)(<\/[^]*?)(head>)([^]*?)(<body)([^]*?<\/[^]*?)(body>)([^]*?<\/)(html>)/gm.exec(html);
	html = "<html_placeholder" + matches[2] + "<head_placeholder" + matches[4] + matches[5] + "head_placeholder>" + matches[7] + "<body_placeholder" + matches[9] + "body_placeholder>" + matches[11] + "html_placeholder>";
	dom = document.createElement('div');
	$(dom).html(html);
	script = $(dom).find('script:not([src])');
	extScript = $(dom).find('script[src]').detach();
	styles = $(dom).find('style').detach();
	css = $(dom).find('link[rel="stylesheet"][href],link[type="text/css"][href]').detach();
	allStyles = getAllStyles(styles);
	replaceScripts = extractInlineScript(script);
	scriptHrefs = request.scriptLinks;
	cssHrefs = request.cssLinks;
	html = $(dom).html().replace('html_placeholder', 'html').replace('head_placeholder', 'head').replace('body_placeholder', 'body');
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
	chrome.tabs.insertCSS(sender.tab.id, {
		file : 'topbar.css'
	},
		function () {
			if (chrome.runtime.lastError) {
				return;
			}
		});
	chrome.tabs.executeScript(sender.tab.id, { code: 'window["html"] = "' + encodeURI(html) + '";window["js"] = "' + encodeURI(replaceScripts) + '";window["css"] = "' + encodeURI(allStyles) + '";window["resources"] = "' + encodeURI(externResources) + '";'});
	chrome.tabs.executeScript(sender.tab.id, {
		file : 'topbar.js'
	},
		function () {
			if (chrome.runtime.lastError) {
				return;
			}
		});
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.action === 'pageToFiddle') {
		pageToFiddle(request, sender);
	}
});