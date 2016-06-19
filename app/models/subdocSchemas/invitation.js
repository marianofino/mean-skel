const mongoose = require("mongoose"),
      Schema = mongoose.Schema;

var InvitationSchema = new Schema({
  date: { type: Date, required: "Date and time are required.", index: true },
  status: { 
    answered: { type: Boolean, default: false },
    attending: { type: Boolean, default: false }
  },
  event: { type: Schema.Types.ObjectId, ref: "Event", required: "Event is required.", index: true }
});

InvitationSchema.pre('save', function (next) {
  var error = null;

  if (this.status.answered) {
    var error = new Error('User has already answered this invitation.');
  } else if (!this.isNew) {
    this.status.answered = true;
  }

  return next(error);
});

InvitationSchema.methods.attend = function() {
  this.status.attending = true;
};

InvitationSchema.methods.decline = function() {
  this.status.attending = false;
};

module.exports = InvitationSchema;
