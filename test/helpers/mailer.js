var nock = require('nock'),
	expect = require('chai').expect,
	factory = require('factory-girl'),
	mailer = require('../../app/helpers/mailer');

describe('mailer Helper', function () {
	var validUser = null;
  var emailNotifications = ['sendActivationEmail', 'sendInvitationEmail', 'sendCancelationEmail', 'sendGuestActionEmail'];

	before(function(done){
		// Create user
  	factory.create("user", function (error, user) {
        if (!error)
          validUser = user;
        else
          throw error;

        done();
    });
  });

  emailNotifications.forEach(function (functionName) {
    it('returns error if delivery fails when sending ' + functionName, function (done) {
      nock('https://api.sendgrid.com:443')
      .post(/.*send*./)
      .reply(400, {"errors":["The provided authorization grant is invalid, expired, or revoked"],"message":"error"});

      mailer[functionName](validUser, function(error){
        nock.cleanAll();
        expect(error).to.exist;
        expect(error.message).to.equal('The provided authorization grant is invalid, expired, or revoked');
          done();
      });
    });
  });

  emailNotifications.forEach(function (functionName) {
    it('do not return error if delivery success when sending ' + functionName, function (done) {
	    nock('https://api.sendgrid.com:443')
	    .post(/.*send*./)
	    .reply(200, {"message":"success"});

	    mailer[functionName](validUser, function(error){
		    nock.cleanAll();
		    expect(error).to.not.exist;
	        done();
	    });
    });
  });

  emailNotifications.forEach(function (functionName) {
    it('returns error if request fails when sending ' + functionName, function (done) {
	    nock('https://api.sendgrid.com:443')
	    .post(/.*send*./)
	    .replyWithError('Some error');

	    mailer[functionName](validUser, function(error){
		    nock.cleanAll();
		    expect(error).to.exist;
	        done();
	    });
    });
  });
});
