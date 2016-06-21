const config = require("../../config").config(),
      User = require("../models/user"),
      Event = require("../models/event");

/**
 * @api {post} /api/events Create event
 * @apiName create_event
 * @apiGroup Events
 * @apiVersion 0.1.0
 *
 * @apiHeader {String} x-access-token Users unique access token
 *
 * @apiParam {String} title Event title
 * @apiParam {String} description Event description
 * @apiParam {Date} datetime Event datetime
 *
 * @apiSuccessExample Success-Response
 *    HTTP/1.1 201 Created
 *    {
 *      event_id: "5766c207de961b2436fd9605",
 *      message:  "Event created!"
 *    }
 *
 * @apiError ValidationError Validation error
 *
 * @apiErrorExample Error-Response
 *    HTTP/1.1 400 Bad Request
 *    {
 *      errors: {
 *        title: {
 *          message: "Title is required."
 *        }
 *      }
 *    }
 */
function createEvent(req, res) {
  var event = new Event();
  event.title = req.body.title;
  event.description = req.body.description;
  event.date = req.body.datetime;
  event.admin_name = req.current_user.firstname + ' ' + req.current_user.lastname;

  // add guests
  if (typeof req.body.guests !== 'undefined')
    // cannot add full array in mongoose, have to iterate
    req.body.guests.forEach(function (guest) {
      event.guests.addToSet(guest);
    });

  event.admin = req.current_user._id;

  event.save(function (error, event) {
    if (error)
      return res.status(400).send(error);

    res.status(201).json({
      event_id: event._id,
      message: "Event created!"
        // TODO: add created event information
    });
  });
}

/**
 * @api {put} /api/event/:event_id Update event
 * @apiName update_event
 * @apiGroup Events
 * @apiVersion 0.1.0
 *
 * @apiHeader {String} x-access-token Users unique access token
 *
 * @apiParam {String} title Event title
 * @apiParam {String} description Event description
 * @apiParam {Array} guests Event guests
 *
 * @apiSuccessExample Success-Response
 *    HTTP/1.1 200 OK
 *    {
 *      message:  "Event updated!"
 *    }
 *
 * @apiError ValidationError Validation error //TODO: change this error type
 *
 * @apiErrorExample Error-Response
 *    HTTP/1.1 400 Bad Request
 *    {
 *      errors: {
 *        event: {
 *          message: "Invalid Event Id."
 *        }
 *      }
 *    }
 */

function updateEvent(req, res) {

  var eventId = req.params.event_id;

  Event.
    findById(eventId).
    select({
      '_id': 1,
      'title': 1,
      'description': 1,
      'date': 1,
      'guests': 1,
      'admin': 1
    }).
    exec().
    then(function (event) {

      if (event == null)
        throw new Error("Not Found");

      if (event.admin.toString() !== req.current_user._id.toString())
        throw new Error("Forbidden");

      if (typeof req.body.title !== 'undefined')
        event.title = req.body.title;

      if (typeof req.body.description !== 'undefined')
        event.description = req.body.description;

      if (typeof req.body.guests !== 'undefined') {

        // remove guests not invited anymore
        event.guests.forEach(function (oldGuest, index) {
          var isInvited = req.body.guests.find(function (newGuest) {
            return newGuest.user.toString() === oldGuest.user.toString();
          });
          if (!isInvited)
            oldGuest.remove();
        });

        // invite new guests
        req.body.guests.forEach(function (newGuest) {
          var isOldGuest = event.guests.find(function (oldGuest) {
            return oldGuest.user.toString() === newGuest.user.toString();
          });
          if (!isOldGuest)
            event.guests.addToSet(newGuest);
        });

      }
      return event.save();
    }).
    then(function (event) {
       // console.log(event.guests);
      res.json({
        message: "Event updated!"
        // TODO: add updated event information
      });
    }).
    catch(function (error) {
      if (error.message === 'Forbidden')
        res.status(403).send({ message: "User does not have permission to update this event." });
      else if (error.message === 'Not Found')
        res.status(404).send({ message: "Event not found." });
      else
        res.status(400).send(error);
    });
}

/**
 * @api {get} /api/event/:event_id Get Event
 * @apiName get_event_by_id
 * @apiGroup Events
 * @apiVersion 0.1.0
 *
 * @apiHeader {String} x-access-token Users unique access token
 *
 * @apiParam {String} title Event title
 * @apiParam {String} description Event description
 * @apiParam {Date} datetime Event datetime
 * @apiParam {ObjectId} admin Event administrator
 *
 * @apiSuccessExample Success-Response
 *    HTTP/1.1 201 Created
 *    {
 *      event: {
 *        _id: "5766c207de961b2436fd9605",
 *        title: "Birthday",
 *        description: "At my house :)",
 *        date: "2017-05-01T08:15:44.926Z",
 *        guests: [
            {
              status: {
                answered: true,
                attending: false
              },
              user: "5766c207de9d1b24369896fg"
            }
          ]
 *      }
 *    }
 *
 * @apiError ValidationError Validation error //TODO: change this error type
 *
 * @apiErrorExample Error-Response
 *    HTTP/1.1 404 Not Found
 *    {
 *      event: null
 *    }
 *
 * @apiError ValidationError Validation error //TODO: change this error type
 *
 * @apiErrorExample Error-Response
 *    HTTP/1.1 400 Bad Request
 *    {
 *      errors: {
 *        event: {
 *          message: "Invalid Event Id."
 *        }
 *      }
 *    }
 */

function getEventById(req, res) {

  var eventId = req.params.event_id;

  Event.
    findById(eventId).
    select({
      _id: 1,
      title: 1,
      date: 1,
      description: 1,
      guests: 1
    }).
    populate({
      path: 'guests'
    }).
    exec().
    then(function (event) {
      if (event == null)
        return res.status(404).send({ event: null });

      res.json({ event: event })
    }).
    catch(function (error) {
      // something bad happened if error
      res.status(400).send({ errors: { event: { message: "Invalid Event Id." } } });
    });

}



/**
 * @api {delete} /api/event/:event_id Delete Event
 * @apiName delete_event_by_id
 * @apiGroup Events
 * @apiVersion 0.1.0
 *
 * @apiHeader {String} x-access-token Users unique access token
 *
 * @apiSuccessExample Success-Response
 *    HTTP/1.1 200 OK
 *    {
 *      message:  "Event deleted!"
 *    }
 *
 * @apiError ValidationError Validation error //TODO: change this error type
 *
 * @apiErrorExample Error-Response
 *    HTTP/1.1 404 Not Found
 *    {
 *      event: null
 *    }
 *
 *
 * @apiError ValidationError Validation error //TODO: change this error type
 *
 * @apiErrorExample Error-Response
 *    HTTP/1.1 400 Bad Request
 *    {
 *      errors: {
 *        event: {
 *          message: "Invalid Event Id."
 *        }
 *      }
 *    }
 */

function removeEvent(req, res) {

  var eventId = req.params.event_id;

  Event.
    findById(eventId).
    select({
      admin: 1,
      // select guests for pre-remove hooks
      guests: 1
    }).
    exec().
    then(function (event) {

      if (event == null)
        throw new Error("Not Found");

      if (event.admin.toString() !== req.current_user._id.toString())
        throw new Error("Forbidden");

      return event.remove();
    }).
    then(function (event) {
      res.json({
        message: "Event deleted!"
        // TODO: add updated event information
      });
    }).
    catch(function (error) {
      if (error.message === 'Forbidden')
        res.status(403).send({ message: "User does not have permission to delete this event." });
      else if (error.message === 'Not Found')
        res.status(404).send({ message: "Event not found." });
      else
        res.status(400).send(error);
    });

}



/**
 * @api {get} /api/events List users
 * @apiName get_event_guest_list
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
 *          date: "2017-05-01T08:15:44.926Z",
 *          admin: "Mike Johnson",
 *          status: {
 *            attending: true,
 *            answered: true
 *          }
 *        }
 *        ...
 *      ]
 *    }
 */

function getEventsOfGuestList(req, res) {
  var events;

  User.
    findOne({
      _id: req.current_user._id
      // TODO: it would be nice to filter here events by date
    }).
    populate({
      path: 'invitations.event',
      select: {
        _id: 1,
        title: 1,
        description: 1,
        date: 1,
        admin: 1,
        admin_name: 1
      },
      sort: {
        // TODO: this sorting is not working
        date: 1
      },
      match: {
        date: { $gte: Date.now() }
      }
    }).
    exec().
    then(function (user) {
      var parsedInvitations = [];

      user.invitations.forEach(function (invitation) {
        if (invitation.event) {
          var responseItem = {
            _id: invitation.event._id,
            description: invitation.event.description,
            title: invitation.event.title,
            admin_name: invitation.event.admin_name,
            date: invitation.event.date,
            status: {
              answered: invitation.status.answered,
              attending: invitation.status.attending
            }
          };
          parsedInvitations.push(responseItem);
        }
      });

      // TODO: it should be better to retrieve it directly from mongodb
      parsedInvitations.sort(function (a, b) {
        if (a.date > b.date)
          return 1;

        if (a.date < b.date)
          return -1;

        return 0;
      });

      res.json({ events: parsedInvitations })
    }).
    catch(function (error) {
      // something bad happened if error
      res.status(500).send(error);
    });

}

exports.createEvent = createEvent;
exports.getEventById = getEventById;
exports.updateEvent = updateEvent;
exports.removeEvent = removeEvent;
exports.getEventsOfGuestList = getEventsOfGuestList;
