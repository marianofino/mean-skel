var expect = require('chai').expect,
    User = require('../../app/models/user'),
    factory = require('factory-girl');

describe('User', function () {

  describe('Valid User', function () {
    var validUser = null;
    var password = "testpassword";

    // Create a user and store it in validUser object
    before(function(done){
      // Create valid user
      factory.create("user", {password: password}, function (error, user) {
          if (!error)
            validUser = user;
          else
            throw error;

          done();
      });
    });

    it('saves password in an encrypted hash', function (done) {
    	expect(validUser.password).to.not.equal(null);
    	expect(validUser.password).to.not.equal(password);
    	expect(validUser.comparePassword(password)).to.equal(true);
    	done();
    });

    it('generates an activation token automatically', function (done) {
      expect(validUser.activation_token).to.not.equal(null);
      done();
    });

    it('is not active by default', function (done) {
      expect(validUser.active).to.equal(false);
      done();
    });

    it('activates their account', function (done) {
      User.activateAccount(validUser.activation_token, function(err, user){
        expect(err).to.not.exist;
        expect(user.active).to.equal(true);
        expect(user.activation_token).to.not.equal(validUser.activation_token);
        done();
      });
    });

    it('can\'t change a fake invitation', function (done) {
      factory.build("invitation", function (error, invitation) {
        factory.create("user", {invitations: [ invitation ]}, function (error, user) {
          invitationId = 0;
          // pick a fake invitation id
          while (++invitationId == user.invitations[0]._id);
          user.attend(invitationId, function (error, updatedUser) {
            expect(error).to.exist;
            expect(error.message).to.equal("Wrong invitation id passed.");
            done();
          });
        });
      });
    });

    it('can\'t change an invitation answer from attend to decline', function (done) {
      factory.build("invitation", function (error, invitation) {
        factory.create("user", {invitations: [ invitation ]}, function (error, user) {
          invitationId = user.invitations[0]._id;
          user.attend(invitationId, function (error, updatedUser) {
            updatedUser.decline(invitationId, function (error, updatedUser) {
              expect(error).to.exist;
              expect(error.message).to.equal("User has already answered this invitation.");
              done();
            });
          });
        });
      });
    });

    it('can\'t change invitation answer from decline to attend', function (done) {
      factory.build("invitation", function (error, invitation) {
        factory.create("user", {invitations: [ invitation ]}, function (error, user) {
          invitationId = user.invitations[0]._id;
          user.decline(invitationId, function (error, updatedUser) {
            updatedUser.attend(invitationId, function (error, updatedUser) {
              expect(error).to.exist;
              expect(error.message).to.equal("User has already answered this invitation.");
              done();
            });
          });
        });
      });
    });

    it('can set invitation answer to attend for the first time', function (done) {
      factory.build("invitation", function (error, invitation) {
        factory.create("user", {invitations: [ invitation ]}, function (error, user) {
          invitationId = user.invitations[0]._id;
          user.attend(invitationId, function (error, updatedUser) {
            expect(error).to.not.exist;
            expect(updatedUser.invitations[0].status.answered).to.be.true;
            expect(updatedUser.invitations[0].status.attending).to.be.true;
            done();
          });
        });
      });
    });

    it('can set invitation answer to decline for the first time', function (done) {
      factory.build("invitation", function (error, invitation) {
        factory.create("user", {invitations: [ invitation ]}, function (error, user) {
          invitationId = user.invitations[0]._id;
          user.decline(invitationId, function (error, updatedUser) {
            expect(error).to.not.exist;
            expect(updatedUser.invitations[0].status.answered).to.be.true;
            expect(updatedUser.invitations[0].status.attending).to.be.false;
            done();
          });
        });
      });
    });

    describe('Valid Invitation', function () {
      var validInvitation = null;

      // Create an invitation and store it in validInvitation object
      before(function(done){
        // Create valid invitation
        factory.build("invitation", function (error, invitation) {
          factory.create("user", {invitations: [ invitation ]}, function (error, user) {
            if (!error)
              validInvitation = user.invitations[0];
            else
              throw error;

            done();
          });
        });
      });

      it('is not answered by default', function () {
        expect(validInvitation.status.answered).to.be.false;
      });

      it('is not attending by default', function () {
        expect(validInvitation.status.attending).to.be.false;
      });

    });
  });

  describe('Invalid User', function () {

    it('is invalid without email', function (done) {
      factory.create("user", {email: null}, function (error, user) {
        expect(error).to.exist;
        email_error = error.errors.email;
        expect(email_error.message).to.equal("Email is required.");
        done();
      });
    });

    it('is invalid without firstname', function (done) {
      factory.create("user", {firstname: null}, function (error, user) {
        expect(error).to.exist;
        firstname_error = error.errors.firstname;
        expect(firstname_error.message).to.equal("First name is required.");
        done();
      });
    });

    it('is invalid without lastname', function (done) {
      factory.create("user", {lastname: null}, function (error, user) {
        expect(error).to.exist;
        lastname_error = error.errors.lastname;
        expect(lastname_error.message).to.equal("Last name is required.");
        done();
      });
    });

    it('is invalid without password', function (done) {
      factory.create("user", {password: null}, function (error, user) {
        expect(error).to.exist;
        password_error = error.errors.password;
        expect(password_error.message).to.equal("Password is required.");
        done();
      });
    });

    it('is invalid with a taken email', function (done) {
      factory.create("user", {email: "test@test.com"}, function (error, user) {
        // Create second user with same email
        factory.create("user", {email: "test@test.com"}, function (error, user) {
          expect(error).to.exist;
          expect(error.code).to.equal(11000); // duplicate entry
          done();
        });
      });
    });

    it('is invalid with an invalid email', function (done) {
      factory.create("user", {email: "test"}, function (error, user) {
        expect(error).to.exist;
        email_error = error.errors.email;
        expect(email_error.message).to.equal("Please fill a valid email address.");
        done();
      });
    });

    it('is invalid with a password length less than 8 characters', function (done) {
      factory.create("user", {password: "1234567"}, function (error, user) {
        expect(error).to.exist;
        password_error = error.errors.password;
        expect(password_error.message).to.equal("Password is too short.");
        done();
      });
    });

    it('is invalid with a non-image file as picture', function (done) {
      factory.create("user", { picture: { original_file: { mimetype: "application/zip" } } }, function (error, user) {
        expect(error).to.exist;
        image_error = error.errors['picture.original_file.mimetype'];
        expect(image_error.message).to.equal("Invalid file.");
        done();
      });
    });

    describe('Invalid Invitation', function () {

      it('is removed if it is repeated', function (done) {
        factory.build("invitation", function (error, invitation) {
          factory.create("user", {invitations: [ invitation, invitation ]}, function (error, user) {
            expect(error).to.not.exist;
            expect(user.invitations).to.have.lengthOf(1);
            done();
          });
        });
      });

      it('is invalid without date/time', function (done) {
        factory.build("invitation", function (error, invitation) {
          invitation.date = null;
          factory.create("user", {invitations: [ invitation ]}, function (error, user) {
            expect(error).to.exist;
            date_error = error.errors['invitations.0.date'];
            expect(date_error.message).to.equal("Date and time are required.");
            done();
          });
        });
      });

      it('is invalid without Event reference', function (done) {
        factory.build("invitation", function (error, invitation) {
          invitation.event = null;
          factory.create("user", {invitations: [ invitation ]}, function (error, user) {
            expect(error).to.exist;
            event_error = error.errors['invitations.0.event'];
            expect(event_error.message).to.equal("Event is required.");
            done();
          });
        });
      });

    });
  });
});
