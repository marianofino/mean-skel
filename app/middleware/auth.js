var jwt = require("jsonwebtoken"),
	config = require("../../config").config(),
	User = require("../models/user");

var secret_token = config.secret;

// middleware to authenticate routes
module.exports = function(req, res, next) {
	var token = req.headers["x-access-token"];
	if (token) {
		jwt.verify(token, secret_token, function(err, decoded){
			if (err) {
				return res.status(403).send({
					success: false,
					message: "Failed to authenticate token."
				});
			} else {
				// Get user
				User.findOne({ _id: decoded._id, email: decoded.email, active: true })
					.select("email password apps._id apps.name apps.icon.url apps.icon.path")
					.exec(function(err, user) {
					if (err) {
						return res.status(403).send({
							success: false,
							message: "Failed to authenticate token."
						});
					} else {
						req.current_user = user;
						next();
					}
				});
			}
		})
	} else {
		return res.status(403).send({
			success: false,
			message: "No token provided."
		});
	}
};