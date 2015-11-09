function closeTopBar() {
	var topMargin, element, topBarSize;
	topMargin = +(/([0-9]*)px/.exec(window.getComputedStyle(document.body).getPropertyValue('margin-top'))[1]);
	element = document.body.querySelector('#googleCacheBrowserTopBar');
	topBarSize = element.clientHeight;
	topMargin = (topMargin - topBarSize) + 'px';
	document.body.removeChild(element);
	document.body.style.marginTop = topMargin;
}

function populateValues() {
	document.getElementById('___html').setAttribute('value', decodeURI(window.html));
	document.getElementById('___css').setAttribute('value', decodeURI(window.css));
	document.getElementById('___js').setAttribute('value', decodeURI(window.js));
	document.getElementById('___resources').setAttribute('value', decodeURI(window.resources));
	document.getElementById('___title').setAttribute('value', document.title + ' - fiddle');
	document.getElementById('___description').setAttribute('value', 'JSFiddle of the page at: ' + window.location.href);
}

function showTopBar() {
	var inner, topBar;
	inner = '<div class="top-bar-content">' +
				'<div class="table-div">' +
					'<span class="middleSpan">' +
						'<p class="view">Send page to JSFiddle</p>' +
					'</span>' +
				'</div>' +
				'<div class="table-div">' +
					'<span class="middleSpan">' +
						'<form action="http://jsfiddle.net/api/post/library/pure/" method="POST" target="_blank" id="jsfiddle-form">' +
							'<input type="hidden" name="html" id="___html" value=""/>' +
							'<input type="hidden" name="css" id="___css" value=""/>' +
							'<input type="hidden" name="js" id="___js" value=""/>' +
							'<input type="hidden" name="panel_html" value="0"/>' +
							'<input type="hidden" name="panel_js" value="0"/>' +
							'<input type="hidden" name="panel_css" value="0"/>' +
							'<input type="hidden" name="resources" id="___resources" value=""/>' +
							'<input type="hidden" name="title" id="___title" value=""/>' +
							'<input type="hidden" name="description" id="___description" value=""/>' +
							'<input type="hidden" name="normalize_css" value="no"/>' +
							'<input type="hidden" name="dtd" value="HTML 5"/>' +
							'<input type="hidden" name="wrap" value="h"/>' +
							'<p class="view"><button type="submit" class="gCbutton" id="browseGoogleCacheButton">SEND!</button></p>' +
						'</form>' +
					'</span>' +
				'</div>' +
				'<div class="closeXButton" id="closeXButtonId">X</div>'+
			'</div>';
	topBar = document.createElement('div');
	topBar.innerHTML = inner;
	topBar.className = 'google-cache-top-bar';
	topBar.id = 'googleCacheBrowserTopBar';
	topBar.querySelector('#closeXButtonId').onclick = closeTopBar;
	document.body.insertBefore(topBar, document.body.firstChild);
	populateValues();
	document.body.style.marginTop = (+(/([0-9]*)px/.exec(window.getComputedStyle(document.body).getPropertyValue('margin-top'))[1]) + topBar.clientHeight) + 'px';
}

showTopBar();
