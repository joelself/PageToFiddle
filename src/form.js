function populateValues() {
	document.getElementById('___html').setAttribute('value', decodeURI(window.html));
	document.getElementById('___css').setAttribute('value', decodeURI(window.css));
	document.getElementById('___js').setAttribute('value', decodeURI(window.js));
	document.getElementById('___resources').setAttribute('value', decodeURI(window.resources));
	document.getElementById('___title').setAttribute('value', document.title + ' - fiddle');
	document.getElementById('___description').setAttribute('value', 'JSFiddle of the page at: ' + window.location.href);
}

function addForm() {
	var inner, topBar, formDiv;
	inner = '<form action="http://jsfiddle.net/api/post/jQuery/2.1.3/" method="POST" target="_blank" id="jsfiddle-form">' +
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
			'</form>';
	formDiv = document.createElement('div');
	formDiv.innerHTML = inner;
	formDiv.style.display = 'none';
	formDiv.id = 'pageToFiddleDiv';
	document.body.appendChild(formDiv);
	populateValues();
	document.getElementById('jsfiddle-form').submit();
	document.body.removeChild(formDiv);
}

addForm();
