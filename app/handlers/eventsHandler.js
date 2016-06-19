const config = require("../../config").config(),
      Event = require("../models/event");

/**
 * @api {post} /api/events Create event
 * @apiName get_list
 * @apiGroup Users
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

    // TODO: update users field with this new data

    res.status(201).json({
      event_id: event._id,
      message: "Event created!"
    });
  });
}

exports.createEvent = createEvent;
