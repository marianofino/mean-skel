const mongoose = require('mongoose'),
      Schema = mongoose.Schema,
      User = require('./user'),
      GuestSchema = require('./subdocSchemas/guest');

// event schema
var EventSchema = new Schema({
  date: { type: Date, required: "Date and time are required.", index: true },
  title: { type: String, trim: true, required: "Title is required." },
  description: { type: String, trim: true, required: "Description is required." },
  admin_name: { type: String, trim: true, default: "Uknown" },
  admin: { type: Schema.Types.ObjectId, ref: "User", required: "Admin user is required.", select: false },
  guests: [GuestSchema],
  created_at: { type: Date, default: Date.now }
});

// don't allow to edit date/time
EventSchema.pre('save', function (next) {
  var error = null;

  if (!this.isNew && this.isModified('date'))
    error = new Error('Date cannot be modified.');

  next(error);
});

// save in admin User ref
EventSchema.pre('save', function (next) {
  var event = this;

  if (!event.isNew)
    return next();

  if (this.isNew) {
    User.
      findOneAndUpdate( {
        _id: event.admin
      }, {
        $addToSet: {
          admin_events: event._id           
        }
      }).
      exec().
      then(function (user) {
        next();
      }).
      // TODO: handle error in a better way.. Transactions would be nice
      catch(next);
  }
});


// TODO: modularize this to a plugin
// silently drop guest if there is another with same User ref
EventSchema.pre('validate', function(next) {
  // array of user ids
  var userRefs = this.guests.map(function (elem) {
    return elem.user;
  });

  // remove duplicate ids
  // TODO: remove calling remove() function
  this.guests = this.guests.filter(function (elem, index, self) {
    // TODO: check if subdoc is new
    return index == userRefs.indexOf(elem.user);
  });

  next();
});

// patch for not calling remove middleware in subdocs (fixed in mongoose repo)
EventSchema.pre('remove', function (next) {
  if (typeof this.guests != 'undefined')
    this.guests.forEach(function (guest) {
        guest.remove();
    });
  next();
});

module.exports = mongoose.model("Event", EventSchema);
