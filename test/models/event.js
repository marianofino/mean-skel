const expect = require('chai').expect,
      factory = require('factory-girl');

describe('Event', function () {

  describe('Valid Event', function () {
    var validEvent = null;

    // Create an event and store it in validEvent object
    before(function(done){
      // Create valid event
      factory.create("event", function (error, event) {
          if (!error)
            validEvent = event;
          else
            throw error;

          done();
      });
    });

    it('can\'t change its date or time once created', function (done) {
      newDate = null;
      // pick a new date other than the one saved
      while ((newDate = new Date()).getTime() === validEvent.date.getTime());
      validEvent.date = newDate;
      validEvent.save(function (error, updatedEvent) {
        expect(error).to.exist;
        expect(error.message).to.equal('Date cannot be modified.');
        done();
      });
    });

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

      it('does not answer by default', function () {
        expect(validGuest.status.answered).to.be.false;
      });

      it('does not attend by default', function () {
        expect(validGuest.status.attending).to.be.false;
      });

    });

  });

  describe('Invalid Event', function () {

    it('is invalid without date/time', function (done) {
      factory.create("event", {date: null}, function (error, event) {
        expect(error).to.exist;
        date_error = error.errors.date;
        expect(date_error.message).to.equal("Date and time are required.");
        done();
      });
    });

    it('is invalid without description', function (done) {
      factory.create("event", {description: null}, function (error, event) {
        expect(error).to.exist;
        description_error = error.errors.description;
        expect(description_error.message).to.equal("Description is required.");
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

      it('is removed if it is repeated', function (done) {
        factory.build("guest", function (error, guest) {
          factory.create("event", {guests: [ guest, guest ]}, function (error, event) {
            expect(error).to.not.exist;
            expect(event.guests).to.have.lengthOf(1);
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
