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

var openerIds = [];
function tabCreated(tab) {
	
}

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
	for (i = 0; i < node.length; i) {
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
		} else {
			i++;
		}
	}
}

function extractInlineScript(scripts, count) {
	var replaced = [], code, othercode, AST, AST_vars, i, varcode, keys, allscript = '', options, varNodes;
	$(scripts).each(function (index) {
		code = $(this).html();
		try {
			AST = parse(code, false, false);
			varNodes = [];
			gatherVars(AST, varNodes);
			AST_vars = ["toplevel", []];
			for (i = varNodes.length - 1; i >= 0; i--) {
				AST_vars[1].splice(0, 0, varNodes[i]);
			}
			options = {indent_start: 0, indent_level: 4, quote_keys: false, space_colon: false, beautify: true, ascii_only: false, inline_script: false};
			othercode = gen_code(AST, options);
			varcode = gen_code(AST_vars, options);
			allscript += 'function fiddle_func_' + count.count + '() {\n' + othercode + '\n}\n';
			$(this).html(varcode + '\nfiddle_func_' + count.count + '();');
		} catch (e) {
			othercode = '';
			var lines = code.split("\n");
			$.each(lines, function (n, line) {
				othercode += '//' + line + '\n';
			});
			allscript += 'function fiddle_func_' + count.count + '() {\n' + "// An exception was thrown when parsing this code.\n\n" + othercode + '\n}\n';
			$(this).html('fiddle_func_' + count.count + '();');
		}
		count.count += 1;
	});
	return allscript;
}

function getAllStyles(styles) {
	var allStyles = '';
	$(styles).each(function (index) {
		allStyles += $(this).html() + '\n\n';
	});
	return allStyles;
}

function encodeURIComponents(query, dummy) {
	var vars, pair, i, result = '';
	if(query != null && query != undefined && query != '') {
		vars = query.split('&');
		for (i = 0; i < vars.length; i++) {
			pair = vars[i].split('=');
			pair[1] = encodeURIComponent(pair[1]);
			if(i != 0) {
				result += '&';
			}
			result += pair[0] + '=' + pair[1];
		}
		result += dummy;
	}
	return result
}

function getAllResources(scripts, css) {
	var externResources = '', i;
	for (i = 0; i < scripts.length; i++) {
		matches = /(.*?\?)(.*)/.exec(scripts[i]);
		if(matches != undefined && matches != null && matches.length > 0) {
			scripts[i] = matches[1] + encodeURIComponents(matches[2], '&dummy=.js');
		}
		if (i == scripts.length - 1 && css.length == 0) {
			externResources += scripts[i];
		} else {
			externResources += scripts[i] + ', ';
		}
	}
	for (i = 0; i < css.length; i++) {
		matches = /(.*?\?)(.*)/.exec(css[i]);
		if(matches != undefined && matches != null && matches.length > 0) {
			css[i] = matches[1] + encodeURIComponents(matches[2], '&dummy=.css');
		}
		if (i == css.length - 1) {
			externResources += css[i];
		} else {
			externResources += css[i] + ', ';
		}
	}
	return externResources;
}

function getURLs(scripts) {
	var i, URLs = [];
	for (i = 0; i < scripts.length; i++) {
		URLs.push($(scripts[i]).attr('src'));
	}
	return URLs;
}

function transformExtBodyScript(scripts) {
	var i, src;
	for (i = 0; i < scripts.length; i++) {
		src = $(scripts[i]).attr('src');
		$(scripts[i]).removeAttr('src');
		$(scripts[i]).html('$.getScript("' + src + '");');
	}
}

function pageToFiddle(request, sender) {
	var html, dom, headScript, bodyScript, extScript, extBodyScript, styles, css, fullStyle, allStyles, replaceScripts, scriptUrls, externResources = '', i, keepScripts, matches, count = {count: 0};
	html = request.html;
	matches = /(<html)(.*?>[\s\S]*?)(<head)([\s\S]*?>[\s\S]*?)(<\/[\s\S]*?)(head>)([\s\S]*?)(<body)([\s\S]*?<\/[\s\S]*?)(body>)([\s\S]*?<\/)(html>)/gm.exec(html);
	html = "<html_placeholder" + matches[2] + "<head_placeholder" + matches[4] + matches[5] + "head_placeholder>" + matches[7] + "<body_placeholder" + matches[9] + "body_placeholder>" + matches[11] + "html_placeholder>";
	dom = document.createElement('div');
	$(dom).html(html);
	// Remove frames
	$(dom).find('frame').detach();
	$(dom).find('iframe').detach();
	// Replace head inline scripts and add external scripts to the list
	headScript = $(dom).find('head_placeholder').find('script:not([src])');
	extScript = $(dom).find('head_placeholder').find('script[src]');
	replaceScripts = extractInlineScript(headScript, count);
	scriptUrls = getURLs(extScript);
	// Replace body inline scripts and dynamically load external scripts with jQuery
	bodyScript = $(dom).find('body_placeholder').find('script:not([src])');
	extBodyScript = $(dom).find('body_placeholder').find('script[src]');
	replaceScripts += '\n' + extractInlineScript(bodyScript, count);
	transformExtBodyScript(extBodyScript);
	// Put inline scripts that were in head, into the body at the beginning
	$(dom).find('body_placeholder').prepend(headScript);
	// Remove inline css and compile them into one string and add external css to the list
	styles = $(dom).find('style').detach();
	css = $(dom).find('link[rel="stylesheet"][href],link[type="text/css"][href]').detach();
	allStyles = getAllStyles(styles);
	// Remove the head element
	$(dom).find('head_placeholder').detach();
	// Remove the html element, but not its children
	dom = $(dom).find('html_placeholder').children().unwrap();
	// Replace the body_placeholder with body 
	html = $(dom).html().replace(/body_placeholder/g, 'body');
	// Compile all external resource URLs into one string making sure to escape query values in case they have a comma in them
	externResources = getAllResources(scriptUrls, request.cssLinks);
	chrome.tabs.executeScript(sender.tab.id, { code: 'window["html"] = "' + encodeURI(html) + '";window["js"] = "' + encodeURI(replaceScripts) +
													 '";window["css"] = "' + encodeURI(allStyles) + '";window["resources"] = "' + encodeURI(externResources) + '";'});
	
	openerIds.push(sender.tab.id);
	window.setTimeout(
	chrome.tabs.onCreated.addListener(tabCreated);
	chrome.tabs.executeScript(sender.tab.id, {
		file : 'form.js'
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