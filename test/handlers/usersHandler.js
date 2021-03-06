var request = require('supertest'),
    factory = require('factory-girl'),
    User = require('../../app/models/user'),
    nock = require('nock'),
    expect = require('chai').expect;

describe('UsersHandler', function () {
	var validUser = null;
	var password = "testpassword";
	var server;

	before(function(done){
		server = require('../../server');

    	// Create valid user
    	factory.create("user", {password: password}, function (error, user) {
	        if (!error)
	          validUser = user;
	        else
	          throw error;

	        done();
	    });
    });

    describe('POST /api/users/authenticate', function () {
    	it('responds with error if user does not exist', function (done) {
	    	request(server)
	    		.post('/api/users/authenticate')
  				.send({ email: 'notregistered@email.com', password: 'testtest' })
  				.expect('Content-Type', /json/)
  				.expect(401,
  					{
  						message: "Login failed",
  						errors: {
  							user:
  								{ message: "Invalid Credentials."  }
  						}
  					}, done);
	    });

    	it('responds with error if user password is wrong', function (done) {
	    	request(server)
	    		.post('/api/users/authenticate')
  				.send({ email: validUser.email, password: 'invalid' })
  				.expect('Content-Type', /json/)
  				.expect(401,
  					{
  						message: "Login failed",
  						errors: {
  							user:
  								{ message: "Invalid Credentials."  }
  						}
  					}, done);
	    });

	    it('responds with error if user is not active', function (done) {
	    	request(server)
	    		.post('/api/users/authenticate')
  				.send({ email: validUser.email, password: password })
  				.expect('Content-Type', /json/)
  				.expect(401,
  					{
  						message: "Login failed",
  						errors: {
  							user:
  								{ message: "Please activate your account."  }
  						}
  					}, done);
	    });

	    it('responds with token and user info if login success', function (done) {
	    	// Set active flag as true
	    	validUser.active = true;
	    	validUser.save(function(err, user) {
	    		request(server)
		    		.post('/api/users/authenticate')
	  				.send({ email: validUser.email, password: password })
	  				.expect('Content-Type', /json/)
	  				.expect(function(response){
	  					expect(response.body.token).to.exist;
	  					expect(response.body.user).to.exist;
	  					expect(response.body.user.email).to.equal(validUser.email);
	  					expect(response.body.user.firstname).to.equal(validUser.firstname);
	  					expect(response.body.user.lastname).to.equal(validUser.lastname);
	  					expect(response.body.user._id).to.equal(String(validUser._id));
	  				})
	  				.expect(200, done);
	    	});
	    });

    });

	describe('POST /api/users', function () {
    	it('responds with error if email exist', function (done) {
	    	request(server)
	    		.post('/api/users')
  				.send({ email: validUser.email, password: 'testtest', firstname: 'James', lastname: 'Doe' })
  				.expect('Content-Type', /json/)
  				.expect(409,
  					{
  						message: "User validation failed",
  						errors: {
  							email:
  								{ message: "A user with that email already exists."  }
  						}
  					}, done);
	    });

	    it('responds with error if some validation fails', function (done) {
	    	request(server)
	    		.post('/api/users')
  				.send({ email: "invalidemail", password: 'testtest', firstname: 'James', lastname: 'Doe' })
  				.expect('Content-Type', /json/)
  				.expect(function(response){
  					expect(response.body.errors).to.exist;
  				})
  				.expect(400, done);
	    });

	    it('responds with success if the user was created', function (done) {
	    	var user = factory.build("user", function(error, user){
	    		request(server)
		    		.post('/api/users')
	  				.send({ email: user.email, password: user.password, firstname: user.firstname, lastname: user.lastname })
	  				.expect('Content-Type', /json/)
	  				.expect(201,
	  					{
	      					message: "User created!"
	    				}, done);
	    	});
	    });

    });

	describe('POST /api/users/activate', function () {
		before(function(done){
			// Set active flag as false
			validUser.active = false;
	    	validUser.save(function(err, user) {
	    		done();
	    	});
	    });

    	it('responds with error if token does not exist', function (done) {
	    	request(server)
	    		.post('/api/users/activate')
  				.send({ activation_token: 'invalidtoken' })
  				.expect('Content-Type', /json/)
  				.expect(400,
  					{
						errors: {
							user: {
								message: "Invalid token."
							}
						}
					}, done);
	    });

	    it('responds with success if the user was activated', function (done) {
	    	request(server)
	    		.post('/api/users/activate')
  				.send({ activation_token: validUser.activation_token })
  				.expect('Content-Type', /json/)
  				.expect(200,
					{
						message: "Account activated."
					}, done);
	    });

    });

    describe('PUT /api/user', function () {
    	var access_token;
		before(function(done){
			// Authenticate user
			request(server)
	    		.post('/api/users/authenticate')
  				.send({ email: validUser.email, password: password })
  				.end(function(err, res){
					access_token = res.body.token;
					done();
				});
	    });

    	it('responds with status 403 if token is not present', function (done) {
	    	request(server)
	    		.put('/api/user')
	    		.expect('Content-Type', /json/)
  				.expect(403, {
					message: "No token provided."
				}, done);
	    });

	    it('responds with status 403 if token is invalid', function (done) {
	    	request(server)
	    		.put('/api/user')
	    		.set('x-access-token', 'invalidtoken')
	    		.expect('Content-Type', /json/)
  				.expect(403, {
					message: "Failed to authenticate token."
				}, done);
	    });

	    it('responds with error if current password is invalid', function (done) {
	    	request(server)
	    		.put('/api/user')
	    		.set('x-access-token', access_token)
	    		.send({ password: "invalid", new_password: "newtestpassword" })
	    		.expect('Content-Type', /json/)
  				.expect(400, {
					message: "User validation failed",
					errors: {
						password: {
							message: "Current password is invalid." }
						}
					}, done);
	    });

	    it('responds with error if some validation fails', function (done) {
	    	request(server)
	    		.put('/api/user')
	    		.set('x-access-token', access_token)
	    		.send({ firstname: "  " }) // Invalid update
	    		.expect('Content-Type', /json/)
	    		.expect(function(response){
  					expect(response.body.errors).to.exist;
  				})
  				.expect(400, done);
	    });

	    it('responds with error if file is invalid', function (done) {
	    	// Mock s3 response
			nock('https://mean-skel.s3.amazonaws.com:443')
				.put(/.*picture*./)
				.reply(200, "", { 'x-amz-id-2': '6pv/eHWz7VrUPAJNr15F3OzFiXIFi/QJU0UArw3pG7/xYSh5LaX+8RQDelmFp61bYuHvWXTJaWs=',
					'x-amz-request-id': '3F74105A9E031597',
					date: 'Tue, 02 Feb 2016 14:14:33 GMT',
					etag: '"21a280f3002ffdf828edd9b56eef380f"',
					'content-length': '0',
					server: 'AmazonS3',
					connection: 'close' });

	    	request(server)
	    		.put('/api/user')
	    		.set('x-access-token', access_token)
	    		.send({ firstname: "Derrick", lastname: "Faulkner" })
	    		.attach('picture', './test/fixtures/invalid-avatar.txt')
	    		.expect('Content-Type', /json/)
	    		.expect(function(response){
  					expect(response.body.errors).to.exist;
  				})
  				.expect(404)
  				.end(function(err, res){
    					nock.cleanAll();
					  done();
				  });
	    });


	    it('responds with success and user info if the user was updated', function (done) {
	    	request(server)
	    		.put('/api/user')
	    		.set('x-access-token', access_token)
	    		.send({ firstname: "Derrick", lastname: "Faulkner" })
	    		.expect('Content-Type', /json/)
	    		.expect(function(response){
  					expect(response.body.errors).to.not.exist;
  					expect(response.body.user).to.exist;
  					expect(response.body.user.email).to.equal(validUser.email);
  					expect(response.body.user.firstname).to.equal("Derrick");
  					expect(response.body.user.lastname).to.equal("Faulkner");
  					expect(response.body.user._id).to.equal(String(validUser._id));
  				})
  				.expect(200, done);
	    });

	    it('uploads an avatar to user', function (done) {
	    	// Mock s3 response
			nock('https://mean-skel.s3.amazonaws.com:443')
				.put(/.*picture*./)
				.reply(200, "", { 'x-amz-id-2': '6pv/eHWz7VrUPAJNr15F3OzFiXIFi/QJU0UArw3pG7/xYSh5LaX+8RQDelmFp61bYuHvWXTJaWs=',
					'x-amz-request-id': '3F74105A9E031597',
					date: 'Tue, 02 Feb 2016 14:14:33 GMT',
					etag: '"21a280f3002ffdf828edd9b56eef380f"',
					'content-length': '0',
					server: 'AmazonS3',
					connection: 'close' });

	    	request(server)
	    		.put('/api/user')
	    		.set('x-access-token', access_token)
	    		.attach('picture', './test/fixtures/avatar.png')
	    		.expect('Content-Type', /json/)
	    		.expect(function(response){
  					expect(response.body.user.picture.url).to.exist;
  					validUser.picture = response.body.user.picture;
  				})
  				.expect(200)
  				.end(function(err, res){
  					nock.cleanAll();
					done();
				});;
	    });

	    it('modifies existing avatar', function (done) {
	    	// Mock s3 response
			nock('https://mean-skel.s3.amazonaws.com:443')
				.put(/.*picture*./)
				.reply(200, "", { 'x-amz-id-2': '6pv/eHWz7VrUPAJNr15F3OzFiXIFi/QJU0UArw3pG7/xYSh5LaX+8RQDelmFp61bYuHvWXTJaWs=',
					'x-amz-request-id': '3F74105A9E031597',
					date: 'Tue, 02 Feb 2016 14:14:33 GMT',
					etag: '"21a280f3002ffdf828edd9b56eef380f"',
					'content-length': '0',
					server: 'AmazonS3',
					connection: 'close' });

	    	request(server)
	    		.put('/api/user')
	    		.set('x-access-token', access_token)
	    		.attach('picture', './test/fixtures/avatar.png')
	    		.expect('Content-Type', /json/)
	    		.expect(function(response){
  					expect(response.body.user.picture.url).to.exist;
  					expect(response.body.user.picture.url).to.not.equal(validUser.picture.url);
  				})
  				.expect(200)
  				.end(function(err, res){
  					nock.cleanAll();
					done();
				});
	    });

    	it('attends event and responds with success', function (done) {
        factory.create('event', function (error, event) {
          if (error) return done(error);

          // invite user
          event.guests.addToSet({ user: validUser._id });

          event.save().
            then(function (event) {

            	request(server)
            	  .put('/api/user')
                .send({ action: 'attend', event: event._id })
                .set('x-access-token', access_token)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(error, response) {
                  if (error) return done(error);

                  User.
                    findById(validUser._id).
                    populate({
                      path: 'invitations.event'
                    }).
                    select({
                      invitations: 1
                    }).
                    exec().
                    then(function (user) {
                      // check status in user collection
                      expect(user.invitations[0].status.answered).to.be.true;
                      expect(user.invitations[0].status.attending).to.be.true;
                      // check status in event collection
                      expect(user.invitations[0].event.guests[0].status.answered).to.be.true;
                      expect(user.invitations[0].event.guests[0].status.attending).to.be.true;
                      done();
                    }).
                    catch(done);

                });

            }).
            catch(done);

        });
      });

    	it('declines event and responds with success', function (done) {
        factory.create('event', function (error, event) {
          if (error) return done(error);

          // invite user
          event.guests.addToSet({ user: validUser._id });

          event.save().
            then(function (event) {

            	request(server)
            	  .put('/api/user')
                .send({ action: 'decline', event: event._id })
                .set('x-access-token', access_token)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(error, response) {
                  if (error) return done(error);

                  User.
                    findById(validUser._id).
                    populate({
                      path: 'invitations.event'
                    }).
                    select({
                      invitations: 1
                    }).
                    exec().
                    then(function (user) {
                      // check status in user collection
                      expect(user.invitations[1].status.answered).to.be.true;
                      expect(user.invitations[1].status.attending).to.be.false;
                      // check status in event collection
                      expect(user.invitations[1].event.guests[0].status.answered).to.be.true;
                      expect(user.invitations[1].event.guests[0].status.attending).to.be.false;
                      done();
                    }).
                    catch(done);

                });

            }).
            catch(done);

        });
      });

    });

	describe('GET /api/user/events', function () {
    	var access_token;
      var validEvent = null;

		  before(function(done){
			  // Authenticate user
			  request(server)
      		.post('/api/users/authenticate')
  				.send({ email: validUser.email, password: password })
  				.end(function(err, res){
				    access_token = res.body.token;

            factory.create('event', {admin: validUser._id}, function (error, event) {
              if (error) return done(error);

              validEvent = event;

				      done();
            });

			    });
      });

    	it('responds with status 403 if token is not present', function (done) {
	    	request(server)
	    		.get('/api/user/events')
	    		.expect('Content-Type', /json/)
  				.expect(403, {
					message: "No token provided."
				}, done);
	    });

	    it('responds with status 403 if token is invalid', function (done) {
	    	request(server)
	    		.get('/api/user/events')
	    		.set('x-access-token', 'invalidtoken')
	    		.expect('Content-Type', /json/)
  				.expect(403, {
					message: "Failed to authenticate token."
				}, done);
	    });

	    it('responds with success if future events list is retrieved', function (done) {
	    	request(server)
	    		.get('/api/user/events')
	    		.set('x-access-token', access_token)
  				.expect('Content-Type', /json/)
  				.expect(function(response) {
  					expect(response.body.events).to.be.lengthOf(1);
  					expect(response.body.events[0]._id).to.equal(validEvent._id.toString());
			      expect(response.body.events[0].title).to.equal(validEvent.title);
			      expect(response.body.events[0].description).to.equal(validEvent.description);
			      expect(response.body.events[0].date).to.equal(validEvent.date.toISOString());
  				})
  				.expect(200, done);
	    });

	    it('responds with success and doesn\'t retrieve past events', function (done) {
        // supose server is running on the same environment than the tests
        factory.create('event', {admin: validUser._id, date: Date.now()}, function (error, event) {
	      	request(server)
	      		.get('/api/user/events')
	      		.set('x-access-token', access_token)
    				.expect('Content-Type', /json/)
    				.expect(function(response) {
    					expect(response.body.events).to.be.lengthOf(1);
  					expect(response.body.events[0]._id).not.to.be.equal(event._id.toString());
    				})
    				.expect(200, done);
	      });
	    });

    });

	describe('GET /api/guests', function () {
    	var access_token;

		  before(function(done){
			  // Authenticate user
			  request(server)
      		.post('/api/users/authenticate')
  				.send({ email: validUser.email, password: password })
  				.end(function(err, res){
				    access_token = res.body.token;
				    done();
			    });
      });

    	it('responds with status 403 if token is not present', function (done) {
	    	request(server)
	    		.get('/api/guests')
	    		.expect('Content-Type', /json/)
  				.expect(403, {
					message: "No token provided."
				}, done);
	    });

	    it('responds with status 403 if token is invalid', function (done) {
	    	request(server)
	    		.get('/api/guests')
	    		.set('x-access-token', 'invalidtoken')
	    		.expect('Content-Type', /json/)
  				.expect(403, {
					message: "Failed to authenticate token."
				}, done);
	    });

	    it('responds with success if user list is retrieved', function (done) {
	    	request(server)
	    		.get('/api/guests')
	    		.set('x-access-token', access_token)
  				.expect('Content-Type', /json/)
  				.expect(function(response){
  					expect(response.body.guests).to.be.instanceof(Array);
  				})
  				.expect(200, done);
	    });

    });

});
