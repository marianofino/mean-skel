const expect = require('chai').expect,
      User = require('../../app/models/user'),
      factory = require('factory-girl');

describe('Event', function () {

  describe('Valid Event', function () {
    var validEvent = null;

    // Create an event and store it in validEvent object
    before('primero', function(done){
      factory.create("event", function (error, event) {
        if (error) return done(error);

        validEvent = event;
        done();
      });
    });

    it('can\'t be changed of date or time once created', function (done) {
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

    it('is saved in User admin ref', function (done) {
      User.
        findById(validEvent.admin).
        select({ _id: 1 }).
        exec().
        then(function (user) {
          expect(user._id.toString()).to.equal(validEvent.admin.toString());
          done();
        }).
        catch(done);
    });

    describe('Valid Guest', function () {
      var validUser = null;
      var validGuest = null;
      var validEvent = null;

      // Create an event and store it in validEvent object
      before(function(done){
        // Create valid event
        factory.create("event", function (error, event) {
          if (error) return done(error);

          factory.create('user', function (error, user) {
            if (error) return done(error);

            validEvent = event;
            validUser = user;

            factory.build("guest", { user: validUser._id }, function (error, guest) {
              if (error) return done(error);

              validEvent.guests.addToSet(guest);
              validEvent.
                save().
                then(function (event) {
                  validGuest = event.guests[0];
                  validEvent = event;
                  done();
                }).
                catch(done);

            });
          });
        });
      });

      it('does not answer by default', function () {
        expect(validGuest.status.answered).to.be.false;
      });

      it('does not attend by default', function () {
        expect(validGuest.status.attending).to.be.false;
      });

      it('creates an invitation in the related user when created', function (done) {
        // saved user doesn't have invitation
        expect(validUser.invitations).to.be.empty;
        // updated user has it
        User.
          findById(validUser._id).
          select({ invitations: 1 }).
          exec().
          then(function (user) {
            // update validUser
            validUser = user;
            expect(validUser.invitations).not.to.be.empty;
            expect(validUser.invitations[0].event.toString()).to.equal(validEvent._id.toString());
            done();
          }).
          catch(done);
      });

      it('removes an invitation in the related user when removed', function (done) {
        // use invitation from previous spec
        expect(validUser.invitations).to.have.lengthOf(1);
        // remove guest
        validGuest.remove();
        // update doc
        validEvent.save().
          then(function (event) {
            // TODO: the middleware is a post-remove hook, so this may fail.. debug why pre-remove is not working
            // updated user does not have invitation anymore
            User.
              findById(validUser._id).
              select({ invitations: 1 }).
              exec().
              then(function (user) {
                expect(user.invitations).to.be.empty;
                done();
              }).
              catch(done);
          }).
          catch(done);
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
