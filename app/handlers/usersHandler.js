var jwt = require("jsonwebtoken"),
  config = require("../../config").config(),
  Event = require("../models/event"),
  User = require("../models/user");

var secret_token = config.secret;

/**
 * @api {post} /api/users/authenticate Authenticate user
 * @apiName authenticate
 * @apiGroup Users
 * @apiVersion 0.1.0
 *
 * @apiParam {String} email User email
 * @apiParam {String} password User password
 *
 * @apiSuccessExample Success-Response
 *    HTTP/1.1 200 OK
 *    {
 *      token:  "12345abcdef",
 *      user: {
 *        _id: user._id,
 *        email: "user@example.com",
 *        firstname: "John",
 *        lastname: "Doe"
 *      }
 *    }
 *
 * @apiError InvalidCredentials Wrong email or password
 *
 * @apiErrorExample Error-Response
 *    HTTP/1.1 401 Not Authorized
 *    {
 *      errors: {
 *        user: {
 *          message: "Invalid Credentials."
 *        }
 *      }
 *    }
 */

function authenticate(req, res){
  User
    .findOne({ email: req.body.email })
    .select("+password +active")
    .exec(function(err, user){
      if (err) throw err;
      if (!user) {
        res.status(401).json({ message: "Login failed",
              errors: { user: { message: "Invalid Credentials."  } } });
      } else {
        var validPassword = user.comparePassword(req.body.password);
        if (!validPassword) {
          res.status(401).json({ message: "Login failed",
              errors: { user: { message: "Invalid Credentials."  } } });
        } else {
          // Check if user is active
          if (!user.active) {
            res.status(401).json({ message: "Login failed",
              errors: { user: { message: "Please activate your account."  } } });
          } else {
            var token = jwt.sign({
              _id: user._id,
              email: user.email
            }, secret_token, { expiresIn: 86400 }); // 86400 seconds = 1 day
            res.json({
              token:  token,
              user: user.asJson()
            });
          }
        }
      }
    });
}

/**
 * @api {post} /api/users Register new user
 * @apiName user_create
 * @apiGroup Users
 * @apiVersion 0.1.0
 *
 * @apiParam {String} email User email
 * @apiParam {String} password User password
 * @apiParam {String} firstname User firstname
 * @apiParam {String} lastname User lastname
 *
 * @apiSuccessExample Success-Response
 *    HTTP/1.1 201 Created
 *    {
 *      token:  "12345abcdef",
 *      user: {
 *        _id: user._id,
 *        email: "user@example.com",
 *        firstname: "John",
 *        lastname: "Doe"
 *      }
 *    }
 *
 * @apiError EmailAlreadyExists The email already exists
 *
 * @apiErrorExample Error-Response
 *    HTTP/1.1 409 Conflict
 *    {
 *      errors: {
 *        email: {
 *          message: "A user with that email already exists."
 *        }
 *      }
 *    }
 *
 * @apiError ValidationError Validation error
 *
 * @apiErrorExample Error-Response
 *    HTTP/1.1 400 Bad Request
 *    {
 *      errors: {
 *        email: {
 *          message: "A user with that email already exists."
 *        }
 *      }
 *    }
 */
function createUser(req, res){
  var user = new User();
  user.email = req.body.email;
  user.password = req.body.password;
  user.firstname = req.body.firstname;
  user.lastname = req.body.lastname;

  user.save(function(err){
    if (err) {
      // duplicate entry
      if (err.code === 11000)
        return res.status(409).json({
          message: "User validation failed",
          errors: {
            email: {
              message: "A user with that email already exists."
            }
          }
        });
      else
        return res.status(400).send(err);
    }
    res.status(201).json({
      message: "User created!"
    });
  });
}

/**
 * @api {put} /api/user Update user
 * @apiName user_update
 * @apiGroup Users
 * @apiVersion 0.1.0
 *
 * @apiHeader {String} x-access-token Users unique access token
 *
 * @apiParam {String} email User email
 * @apiParam {String} password User password
 * @apiParam {String} firstname User firstname
 * @apiParam {String} lastname User lastname
 *
 * @apiSuccessExample Success-Response
 *    HTTP/1.1 200 OK
 *    {
 *      message:  "User updated!",
 *      user: {
 *        _id: user._id,
 *        email: "user@example.com",
 *        firstname: "John",
 *        lastname: "Doe"
 *      }
 *    }
 *
 * @apiError InvalidPassword Wrong password
 *
 * @apiErrorExample Error-Response
 *    HTTP/1.1 400 Bad Request
 *    {
 *      errors: {
 *        password: {
 *          message: "Current password is invalid."
 *        }
 *      }
 *    }
 */
function updateCurrentUser(req, res) {
  var user = req.current_user;
  if(req.files.picture) {
    user.picture = {
      url: null,
      path: null,
      original_file: req.files.picture
    };
  }
  if (req.body.password && req.body.new_password) {
    // Check current password
    var validPassword = user.comparePassword(req.body.password);
    if (!validPassword) {
      return res.status(400).json({
        message: "User validation failed",
        errors: {
          password: {
            message: "Current password is invalid." }
        }
      });
    }

    user.password = req.body.new_password;
  }

  if (req.body.firstname){
    user.firstname = req.body.firstname
  }

  if (req.body.lastname ){
    user.lastname = req.body.lastname
  }

  if (req.body.action === 'attend' && req.body.event) {
    var invitation = user.invitations.find(function (invitation) {
      return invitation.event.toString() === req.body.event;
    });
    if (invitation)
      invitation.attend();
  }

  if (req.body.action === 'decline' && req.body.event) {
    var invitation = user.invitations.find(function (invitation) {
      return invitation.event.toString() === req.body.event;
    });
    if (invitation)
      invitation.decline();
  }

  return user.save().
    then(function (updatedUser) {
      // update staus in events collection
      if (req.body.action)
        return Event.
          findOne({
            _id: invitation.event,
            // TODO: this filter is not working
            'guests.user': req.current_user._id
          }).
          populate({
            // get admin data so we can access to it in the guest post-hook
            path: 'admin'
          }).
          select({
            guests: 1,
            admin: 1
          }).
          exec().
          then(function (event) {
            // it brings all the guests, pick the one our user is
            var i = event.guests.findIndex(function (guest) {
              return req.current_user._id.toString() == guest.user.toString();
            });
            event.guests[i].status.answered = true;
            if (req.body.action == 'attend')
              event.guests[i].status.attending = true;
            else
              event.guests[i].status.attending = false;

            return event.save();
          });
      else
        return updatedUser;
    }).
    then (function (updatedUser) {
      if (req.body.action)
        res.json({
          message: "New status saved!"
        });
      else
        res.json({
          message: "User updated!",
          user: updatedUser.asJson()
        });
    }).
    catch(function(error) {
      return res.status(400).send(error);
    });



    // TODO: this should be after save
    // update event status
/*
*/

}

/**
 * @api {get} /api/guests List users
 * @apiName get_list
 * @apiGroup Users
 * @apiVersion 0.1.0
 *
 * @apiHeader {String} x-access-token Users unique access token
 *
 * @apiSuccessExample Success-Response
 *    HTTP/1.1 200 OK
 *    {
 *      guests: [
 *        {
 *          _id: "5766c207de961b2436fd9605",
 *          firstname: "John",
 *          lastname: "Doe"
 *        },
 *        ...
 *      ]
 *    }
 */
function getList(req, res) {
  var guests;

  User.find()
    .select({
      _id: 1,
      firstname: 1,
      lastname: 1
    })
    .exec(function (error, users) {
      // something bad happened if error
      if (error) return res.status(500).send(error);

      return res.json({ guests: users });
    });
}

/**
 * @api {get} /api/user/events List users
 * @apiName get_event_admin_list
 * @apiGroup Users
 * @apiVersion 0.1.0
 *
 * @apiHeader {String} x-access-token Users unique access token
 *
 * @apiSuccessExample Success-Response
 *    HTTP/1.1 200 OK
 *    {
 *      events: [
 *        {
 *          _id: "5766c207de961b2436fd9605",
 *          title: "Birthday",
 *          description: "At my house :)",
 *          date: "2017-05-01T08:15:44.926Z"
 *        }
 *        ...
 *      ]
 *    }
 */

function getEventAdminList(req, res) {
  var events;

  User.
    findById(req.current_user._id).
    select({
      admin_events: 1
    }).
    populate({
      path: 'admin_events',
      select: {
        _id: 1,
        title: 1,
        description: 1,
        date: 1
      },
      match: {
        date: { $gte: Date.now() }
      },
      sort: {
        date: 1
      }
    }).
    exec().
    then(function (events) {
      res.json({ events: events.admin_events })
    }).
    catch(function (error) {
      // something bad happened if error
      res.status(500).send(error);
    });

}

/**
 * @api {post} /api/users/activate Activate user
 * @apiName user_activate
 * @apiGroup Users
 * @apiVersion 0.1.0
 *
 * @apiParam {String} activation_token Activation token
 *
 * @apiSuccessExample Success-Response
 *    HTTP/1.1 200 OK
 *    {
 *      message:  "Account activated."
 *    }
 *
 * @apiError InvalidToken Invalid activation token
 *
 * @apiErrorExample Error-Response
 *    HTTP/1.1 400 Bad Request
 *    {
 *      errors: {
 *        user: {
 *          message: "Invalid token."
 *        }
 *      }
 *    }
 */
function activateAccount(req, res) {
  User.activateAccount(req.body.activation_token, function(err, user) {
    if (err) return res.send(err);

    if (user)
        return res.json({
          message: "Account activated."
        });
    else
      return res.status(400).json({
        errors: {
          user: {
            message: "Invalid token."
          }
        }
      });
  });
}

exports.authenticate = authenticate;
exports.createUser = createUser;
exports.updateCurrentUser = updateCurrentUser;
exports.activateAccount = activateAccount;
exports.getList = getList;
exports.getEventAdminList = getEventAdminList;
