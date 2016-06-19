const mongoose = require("mongoose"),
      User = require('../user'),
      Schema = mongoose.Schema;

var GuestSchema = new Schema({
  status: { 
    answered: { type: Boolean, default: false },
    attending: { type: Boolean, default: false }
  },
  user: { type: Schema.Types.ObjectId, ref: "User", required: "Guest must have an associated user.", index: true }
});

// create invitation before saving itself as guest; both event and guest have been validated
// so the chances of error are low; still transactions would be a nice feature to implement
GuestSchema.pre("save", function(next) {

  var guest = this;

  if (!guest.isNew)
    return next();

  if (guest.isNew) {
    // create a new invitaion subdoc in user
    User.
      findOneAndUpdate( {
        _id: guest.user
      }, {
        $addToSet: {
          invitations: {
            date: guest.event.date,
            event: guest.event._id
          }            
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

GuestSchema.pre("remove", function(next) {

  var guest = this;

  // removes invitaion subdoc in user
  User.
    findOneAndUpdate( {
      _id: guest.user
    }, {
      $pull: {
        invitations: {
          event: guest.event._id
        }            
      }
    }).
    exec().
    then(function (user) {
      next();
    }).
    // TODO: handle error in a better way.. Transactions would be nice
    catch(next);
});

module.exports = GuestSchema;
