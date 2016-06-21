const mongoose = require("mongoose"),
      User = require('../user'),
      mailer = require("../../helpers/mailer"),
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
            date: new Date(guest.parent().date),
            event: guest.parent()._id
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


GuestSchema.pre("save", function(next) {
  this.wasNew = this.isNew;

  // set flag to send email when status changed
  if (!this.isNew && this.isModified('status.answered'))
    this.sendAdminEmail = true;
  else
    this.sendAdminEmail = false;
    
  next();
});

// send new invitation email
GuestSchema.post("save", function(guest) {

  if (this.wasNew && process.env.NODE_ENV !== 'test') {

    // TODO: debug why this hook is being called twice
    this.wasNew = false;

    User.
      findById(guest.user).
      exec().
      then(function (user) {
        mailer.sendInvitationEmail(user, function(error){
          // TODO: Handle error if exists
        });
      }).
      catch(function (error) {
        // TODO: handle error in a better way.. Transactions would be nice
        //console.log(error);
      });

  }

});

// send event cancelation email
GuestSchema.post("remove", function(guest) {

  if (process.env.NODE_ENV !== 'test') {

    console.log('entro aca');

    User.
      findById(guest.user).
      exec().
      then(function (user) {
        console.log(user);
        mailer.sendCancelationEmail(user, function(error){
          // TODO: Handle error if exists
        });
      }).
      catch(function (error) {
        // TODO: handle error in a better way.. Transactions would be nice
        //console.log(error);
      });

  }

});

// send notification to admin of new guest status
GuestSchema.post('save', function (guest) {

  if (this.sendAdminEmail && process.env.NODE_ENV !== 'test')
    mailer.sendGuestActionEmail(this.parent().admin, function(error){
      // TODO: Handle error if exists
    });

});

// TODO: for some reason remove pre-hook is not working
// remove invitation when guest is removed
GuestSchema.post("remove", function(guest) {

  User.
    findOneAndUpdate( {
      _id: guest.user
    }, {
      $pull: {
        invitations: {
          event: guest.parent()._id.toString()
        }            
      }
    }).
    exec().
    catch(function (error) {
      // TODO: handle error in a better way.. Transactions would be nice
      console.log(error);
    });

});

module.exports = GuestSchema;
