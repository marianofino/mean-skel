const expect = require('chai').expect,
      factory = require('factory-girl');

describe('Event', function () {

  describe('Valid Event', function () {

    describe('Valid Guest', function () {
      var validGuest = null;

      // Create a guest and store it in validGuest object
      before(function(done){
        // Create valid guest
        factory.build("guest", function (error, guest) {
          factory.create("event", {guests: [ guest ]}, function (error, event) {
            if (!error)
              validGuest = event.guests[0];
            else
              throw error;

            done();
          });
        });
      });

      it('has a default action taken equal to 0', function () {
        expect(validGuest.action_taken).to.equal(0);
      });

    });

    // TODO: validate internal methods and automatic actions (send email, forbid change date, etc.)

  });

  describe('Invalid Event', function () {
    // TODO: invalidate past dates?
    // TODO: invalidate wrong objects types (user, guests, dates, etc.)

    it('is invalid without date/time', function (done) {
      factory.create("event", {date: null}, function (error, event) {
        expect(error).to.exist;
        date_error = error.errors.date;
        expect(date_error.message).to.equal("Date and time are required.");
        done();
      });
    });

    it('is invalid without title', function (done) {
      factory.create("event", {title: null}, function (error, event) {
        expect(error).to.exist;
        title_error = error.errors.title;
        expect(title_error.message).to.equal("Title is required.");
        done();
      });
    });

    it('is invalid without admin user', function (done) {
      factory.create("event", {admin: null}, function (error, event) {
        expect(error).to.exist;
        admin_error = error.errors.admin;
        expect(admin_error.message).to.equal("Admin user is required.");
        done();
      });
    });

    describe('Invalid Guest', function () {

      it('is invalid with action id greater than range [0,2]', function (done) {
        factory.build("guest", function (error, guest) {
          guest.action_taken = 3;
          factory.create("event", {guests: [ guest ]}, function (error, event) {
            expect(error).to.exist;
            action_error = error.errors['guests.0.action_taken'];
            expect(action_error.kind).to.equal("max");
            expect(action_error.message).to.equal("Invalid guest action.");
            done();
          });
        });
      });

      it('is invalid with action id lower than range [0,2]', function (done) {
        factory.build("guest", function (error, guest) {
          guest.action_taken = -1;
          factory.create("event", {guests: [ guest ]}, function (error, event) {
            expect(error).to.exist;
            action_error = error.errors['guests.0.action_taken'];
            expect(action_error.kind).to.equal("min");
            expect(action_error.message).to.equal("Invalid guest action.");
            done();
          });
        });
      });

      it('is invalid without User reference', function (done) {
        factory.build("guest", function (error, guest) {
          guest.user = null;
          factory.create("event", {guests: [ guest ]}, function (error, event) {
            expect(error).to.exist;
            action_error = error.errors['guests.0.user'];
            expect(action_error.message).to.equal("Guest must have an associated user.");
            done();
          });
        });
      });

    });
  });
});
