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

  if (this.isModified('status.answered') && !this.status.answered)
    var error = new Error('User has already answered this invitation.');

  next(error);
});

InvitationSchema.methods.attend = function() {
  if (!this.status.answered) {
    this.status.attending = true;
    this.status.answered = true;
  } else
    // send warn that answered is trying to be changed
    this.status.answered = false;
};

InvitationSchema.methods.decline = function() {
  if (!this.status.answered) {
    this.status.attending = false;
    this.status.answered = true;
  } else
    // send warn that answered is trying to be changed
    this.status.answered = false;
};

module.exports = InvitationSchema;
