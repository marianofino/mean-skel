const mongoose = require("mongoose"),
      Schema = mongoose.Schema;

// event schema
var EventSchema = new Schema({
  date: { type: Date, required: "Date and time are required.", index: true },
  title: { type: String, trim: true, required: "Title is required." },
  description: { type: String, trim: true },
  admin: { type: Schema.Types.ObjectId, ref: "User", required: "Admin user is required." },
  guests: [{
    // TODO: replace by text?
    // action_taken -> index of ['not answered', 'declined', 'attend']
    action_taken: { type: Number, default: 0, min: [0, "Invalid guest action."], max: [2, "Invalid guest action."] },
    user: { type: Schema.Types.ObjectId, ref: "User", required: "Guest must have an associated user." }
  }],
  created_at: { type: Date, default: Date.now }
});

// silently drop guest if there is another with same User ref
EventSchema.pre("validate", function(next) {
  // array of user ids
  var userRefs = this.guests.map(function (elem) {
    return elem.user;
  });

  // remove duplicate ids
  this.guests = this.guests.filter(function (elem, index, self) {
    return index == userRefs.indexOf(elem.user);
  });

  next();
});

// TODO: when this grows modulariwe to another file
module.exports = mongoose.model("Event", EventSchema);
