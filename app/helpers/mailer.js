var config = require('../../config').config();
var sendgrid = require('sendgrid')(config.sendgrid.API_KEY);

function sendActivationEmail(user, done) {
	try {
		var link = config.base_url + "/activate/" + user.activation_token;

		// TODO: remove this line
		if (process.env.NODE_ENV !== 'test') console.log("ACTIVATION LINK: " + link);

		var email     = new sendgrid.Email({
			to:       user.email,
			from:     'no-reply@meanskel.com',
			fromname: 'MEAN skel',
			subject:  'Please activate your account!',
			html:     "<p>Welcome! " + user.email + "</p><p>Please follow this link to activate your account</p><p><a href='" + link + "'>" + link + "</a></p>"
		});

		sendgrid.send(email, function(err, json) {
			if (err)
				done(err);
			else
				done(null);
		});
	}
	catch(err) {
	    done(err);
	}
}

function sendInvitationEmail(user, done) {
	try {
		var link = config.base_url + "/agenda/";

		// TODO: remove this line
		if (process.env.NODE_ENV !== 'test') console.log("AGENDA LINK: " + link);

		var email     = new sendgrid.Email({
			to:       user.email,
			from:     'no-reply@meanskel.com',
			fromname: 'MEAN skel',
			subject:  'New invitation!',
			html:     "<p>Hello! " + user.firstname + "</p><p>You've received a new invitation. Go to your agenda: </p><p><a href='" + link + "'>" + link + "</a></p>"
		});

		sendgrid.send(email, function(err, json) {
			if (err)
				done(err);
			else
				done(null);
		});
	}
	catch(err) {
	    done(err);
	}
}

function sendCancelationEmail(user, done) {
	try {
		var link = config.base_url + "/agenda/";

		// TODO: remove this line
		if (process.env.NODE_ENV !== 'test') console.log("AGENDA LINK: " + link);

		var email     = new sendgrid.Email({
			to:       user.email,
			from:     'no-reply@meanskel.com',
			fromname: 'MEAN skel',
			subject:  'Event canceled!',
			html:     "<p>Hello! " + user.firstname + "</p><p>An event you were invited just got cancelled. Go to your agenda to find out more: </p><p><a href='" + link + "'>" + link + "</a></p>"
		});

		sendgrid.send(email, function(err, json) {
			if (err)
				done(err);
			else
				done(null);
		});
	}
	catch(err) {
	    done(err);
	}
}

function sendGuestActionEmail(user, done) {
	try {
		var link = config.base_url + "/myevents/";

		// TODO: remove this line
		if (process.env.NODE_ENV !== 'test') console.log("MY EVENTS LINK: " + link);

		var email     = new sendgrid.Email({
			to:       user.email,
			from:     'no-reply@meanskel.com',
			fromname: 'MEAN skel',
			subject:  'A guest has answered!',
			html:     "<p>Hello! " + user.firstname + "</p><p>A guest answered to one of your events. Go to your account to find out more: </p><p><a href='" + link + "'>" + link + "</a></p>"
		});

		sendgrid.send(email, function(err, json) {
			if (err)
				done(err);
			else
				done(null);
		});
	}
	catch(done) {
	    done(err);
	}
}

exports.sendActivationEmail = sendActivationEmail;
exports.sendInvitationEmail = sendInvitationEmail;
exports.sendCancelationEmail = sendCancelationEmail;
exports.sendGuestActionEmail = sendGuestActionEmail;
