// Server configuration
var SERVER_HOST = '127.0.0.1';
var SERVER_PORT = 3000;
 
// Socket.IO client creation and connection with Node server.
var socket = io.connect('http://'+SERVER_HOST+':'+SERVER_PORT),
	user_id = null,
	setUser = function(uid) {
		user_id = uid;
		chrome.cookies.set({
			url: 'http://' + SERVER_HOST,
			name: 'user_id',
			value: '' + user_id, // Convert Int to Str
			expirationDate: (new Date()).getTime()/1000 + (60 * 60 * 24 * 365 * 2)	
		});
		socket.emit('subscribe', {
			room: 'extension-' + user_id
		});
	};

// Special connection function for the extension. Used for incremending user count
socket.emit('extension_connect');

chrome.storage.sync.get('uid', function(storageObj) {
	if (!_.isEmpty(storageObj) && storageObj.uid) {
		// User exists. Connect as that user
		setUser(storageObj.uid);
	} else {
		// User does not exist. Let's make a new one
		socket.on('new_user', function(data) {
			chrome.storage.sync.set({
				'uid': data._id
			}, function() {
				setUser(data._id);
			});
		});
		socket.emit('new_user');
	}
});

// Wrapper function that gets new page action and
// sends it to the nodeJS backend
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.type === 'visit') {
		if (typeof user_id === 'number' && request.data.title) {
			socket.emit(
				'new_visit', 
				JSON.stringify({
					user_id: user_id,
					link: request.data.link,
					title: request.data.title,
					domain: request.data.domain,
					image: request.data.image
				})
			);
		}
	}
});

// Action relay. When a user takes action on your visit, you need
// to be notified.
socket.on('extension-action', function(data) {
	chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.sendMessage(tab.id, {
			type: 'action',
			data: data
		});
	});
});
