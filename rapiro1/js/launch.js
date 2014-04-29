/**
 * RAPIRO Controller
 * 2014.04.25 K.OHWADA
 */

chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('main.html', {
		id: "mainwin",
		bounds: {
			width: 380,
			height: 680
		}
	});
});
