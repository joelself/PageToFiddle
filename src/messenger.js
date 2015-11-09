window.addEventListener('message', function (event) {
	var message;
	if (event.source !== window) {
		return;
	}
	message = event.data;
	if (typeof message !== 'object' || message === null || !message.html) {
		return;
	}
	chrome.runtime.sendMessage({
		action : 'pageToFiddle',
		html : message.html,
		scriptLinks: message.scriptLinks,
		cssLinks: message.cssLinks
	});
});