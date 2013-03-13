// Server configuration
var SERVER_HOST = '127.0.0.1';
var SERVER_PORT = 3000;
 
// Socket.IO client creation and connection with Node server.
var socket = io.connect('http://127.0.0.1:3000');

// Wrapper function that gets new page action and
// sends it to the nodeJS backend
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	socket.send(JSON.stringify({
		attrs: {
			link: request.link,
			title: request.title
		}
	}));
});

