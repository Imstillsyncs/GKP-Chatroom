var client = io();
var room = window.location.pathname === '/' ? '/main' : window.location.pathname;
var key = false;

var chathistory = [];
var index = 0;

var chatlog = {};
var lasttime = new Date();
var username;
let lastuser = '';

var version = '1.0.1';
var unread = 0;
var focus = true;

$(document).ready(function () {
	$('.message').focus();

	client.emit('join', room);
	room = room.substr(1);
	if (localStorage.getItem('chatlog') && localStorage.getItem('version') === version) {
		chatlog = JSON.parse(localStorage.getItem('chatlog'));
	} else {
		localStorage.setItem('version', version);
	}
	client.on('bounce', function (data) {
		switch (data.type) {
			case 'join':
				if (localStorage.getItem('username')) {
					username = localStorage.getItem('username');
					client.emit('message', { message: `/nick ${localStorage.getItem('username')}` });
				}
				document.title = `LowChat | ${room}`;
				parseChatLog();
				break;
		}
	});
	client.on('message', function (data) {
		data.time = formatDate(new Date());
		appendLog(data);
		if (!focus) {
			unread++;
			document.title = `Go Knights Productions Chat Room | ${room} (${unread})`;
			$('#icon').prop('href', 'images/fav-unread.png');
		}
	});

	$('#message').on('keydown', function (e) {
		let message = $(this).text();
		if (e.keyCode === 13 && !e.shiftKey) {
			e.preventDefault();
			$(this).text('');
			if (message.indexOf('/join') === 0) {
				window.location.pathname = '/' + message.split(' ')[1];
			} else if (message.indexOf('/clearlog') === 0) {
				chatlog[room] = [];
				localStorage.setItem('chatlog', JSON.stringify(chatlog));
				location.reload();
			} else if (message.indexOf('/clearname') === 0) {
				localStorage.removeItem('username');
			} else {
				if (message.indexOf('/nick') === 0) {
					localStorage.setItem('username', message.split(' ')[1]);
				}
				client.emit('message', { message });
				chathistory.unshift(message);
				index = 0;
			}
		} else if (e.keyCode === 38) {
			e.preventDefault();
			$(this).text(chathistory[index]);
			index = (index + 1) % chathistory.length;
		} else if (e.keyCode === 40) {
			e.preventDefault();
			$(this).text(chathistory[index]);
			index = index - 1 < 0 ? 0 : index - 1;
		}
	});
});

function parseChatLog() {
	if (chatlog) {
		for (let i in chatlog[room]) {
			appendLog(chatlog[room][i], true);
		}
		appendLog({ name: '', message: '====== CACHE ======', color: 'white', time: formatDate(new Date()) }, true);
	}
}

function appendLog(data, avoid) {
	let logdiv = document.getElementById('log');
	let template = $('#itemTemplate').html();
	let message = data.message.replace(/http(s)*:\/\/[^\s]*/g, '<a href="$&">$&</a>');
	let color = data.color || data.name;
	let time = data.time;
	let type = 'n';
	let isMe = data.name === username;
	let id = randHex();
	if (data.name === 'server') {
		template = template.replace('{{type}}', 'server');
		data.name = ' * ';
		avoid = true;
	} else if (data.type && data.type === 'direct') {
		template = template.replace('{{type}}', 'pm');
		avoid = true;
	} else if (isMe) {
		template = template.replace('{{type}}', 'me');
	} else {
		template = template.replace('{{type}}', '');
	}
	if (data.name === lastuser) {
		template = template.replace('{{same}}', 'same');
	} else {
		template = template.replace('{{same}}', '');
	}
	lastuser = data.name;
	data.date = new Date(data.date);	
	lasttime = new Date(lasttime);	
	console.log(data.message, days(data.date), days(new Date()));	
	if (data.date && lasttime && days(data.date) > days(lasttime)) {	
		appendLog({	
			name: '',	
			message: `------ ${data.date.toDateString()} ------`,	
			color: 'white',	
			time: formatDate(data.date),	
			date: false	
		}, true);	
	}	
	lasttime = data.date;
	template = template.replace('{{name}}', data.name);
	template = template.replace('{{message}}', message);
	// template = template.replace('{{color}}', color);
	template = template.replace('{{time}}', time);
	template = template.replace('{{id}}', id);
	$('.log').append(template);
	setTimeout(function () { $('#' + id).removeClass('load') }, 0);
	$('.log .item-name').each(function () {
		$(this).css('color', '#' + $(this).data('color'));
		if ($(this).text().match('@')) {
			$(this).css('color', 'red');
		}
	});
	logdiv.scrollTop = logdiv.scrollHeight;
	if (!avoid) {
		if (!chatlog[room]) {
			chatlog[room] = [];
		}
		chatlog[room].push(data);
		if (chatlog[room].length > 60) {
			chatlog[room] = chatlog[room].slice(chatlog[room].length - 60);
		}
		localStorage.setItem('chatlog', JSON.stringify(chatlog));
	}
}

function formatDate(date) {
	let ampm = date.getHours() > 12 ? 'PM' : 'AM';	
	let hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();	
	let minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();	
	return `${hours}:${minutes} ${ampm}`;	
}

function days(date) {	
	date = date - date.getTimezoneOffset()*60;	
	return Math.round(date / 1000 / 60 / 60 / 24);	
}

$(window).focus(function () {
	focus = true;
	unread = 0;
	document.title = 'Go Knights Productions Chat Room | ' + room;
	$('#icon').prop('href', 'images/fav.png');
}).blur(function () {
	focus = false;
});

function randHex() {
	return Math.floor(Math.random() * 16777215).toString(16);
}