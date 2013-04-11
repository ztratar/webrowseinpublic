// Server configuration
var SERVER_HOST = '127.0.0.1';
var SERVER_PORT = 3000;
 
// Socket.IO client creation and connection with Node server.
var socket = io.connect('http://127.0.0.1:3000'),
	user_id = null;

chrome.storage.sync.get('uid', function(storageObj) {
	if (!_.isEmpty(storageObj) && storageObj.uid) {
		// User exists. Connect as that user
		user_id = storageObj.uid;
	} else {
		// User does not exist. Let's make a new one
		socket.on('new_user', function(data) {
			chrome.storage.sync.set({
				'uid': data.id
			}, function() {
				user_id = data.id;
			});
		});
		socket.send(JSON.stringify({
			type: 'new_user'
		}));
	}
});

// Wrapper function that gets new page action and
// sends it to the nodeJS backend
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if (user_id) {
		socket.send(JSON.stringify({
			type: 'new_visit',
			data: {
				user_id: user_id,
				link: request.link,
				title: request.title,
				domain: request.domain
			}
		}));
	}
});

