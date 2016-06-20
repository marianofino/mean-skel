var request = require('supertest'),
    factory = require('factory-girl'),
    Event = require('../../app/models/event'),
    server = require('../../server'),
    expect = require('chai').expect;

describe('EventsHandler', function () {
	var validUser = null;
	var password = "testpassword";

	before(function(done){
  	// Create valid user
  	factory.create("user", {password: password}, function (error, user) {
      if (error) return done(error);

      user.active = true;
      user.save(function (error, user) {
        if (error) return done(error);

        validUser = user;

        done();
      });
    });
  });

  describe('POST /api/events', function () {
  	var access_token;

	  before(function(done){
		  // Authenticate user
		  request(server)
    		.post('/api/users/authenticate')
				.send({ email: validUser.email, password: password })
        .end(function(error, response) {
          if (error) return done(error);

			    access_token = response.body.token;

          done();
        });
    });

  	it('responds with status 403 if token is not present', function (done) {
    	request(server)
    		.post('/api/events')
    		.expect('Content-Type', /json/)
				.expect(403)
        .end(function(error, response) {
          if (error) return done(error);

          expect(response.body.message).to.equal("No token provided.");

          done();
        });
    });

    it('responds with status 403 if token is invalid', function (done) {
    	request(server)
    		.post('/api/events')
    		.set('x-access-token', 'invalidtoken')
    		.expect('Content-Type', /json/)
				.expect(403)
        .end(function(error, response) {
          if (error) return done(error);

          expect(response.body.message).to.equal("Failed to authenticate token.");

          done();
        });
    });

    it('responds with error if some validation fails', function (done) {
    	var event = factory.build("event", function(error, event) {
      	request(server)
      		.post('/api/events')
	    		.set('x-access-token', access_token)
  				.send({ description: event.description, datetime: event.datetime })
  				.expect('Content-Type', /json/)
  				.expect(400)
          .end(function(error, response) {
            if (error) return done(error);

  					expect(response.body.errors).to.exist;

            done();
          });
    	});
    });

    it('responds with success if the event was created without guests', function (done) {
    	var event = factory.build("event", function(error, event) {
    		request(server)
	    		.post('/api/events')
	    		.set('x-access-token', access_token)
  				.send({ title: event.title, description: event.description, datetime: event.date })
  				.expect('Content-Type', /json/)
  				.expect(201)
          .end(function(error, response) {
            if (error) return done(error);

            expect(response.body.message).to.equal("Event created!");

            Event.
              findById(response.body.event_id).
              select({ guests: 1 }).
              exec().
              then(function (event) {
                expect(event.guests).to.be.empty;
                done();
              }).
              catch(function (error) {
                done(error);
              });
          });
    	});
    });

    it('responds with success if the event was created with many guests', function (done) {
      var totalGuests = 5;
      var guest = factory.createMany("guest", totalGuests, function (error, guests) {
      	var event = factory.build("event", {guests: guests}, function(error, event) {
      		request(server)
	      		.post('/api/events')
	      		.set('x-access-token', access_token)
    				.send({ title: event.title, description: event.description, datetime: event.date, guests: guests })
    				.expect('Content-Type', /json/)
            .expect(201)
            .end(function(error, response) {
              if (error) return done(error);

              expect(response.body.message).to.equal("Event created!");
              expect(response.body.event_id).to.exist;

              Event.
                findById(response.body.event_id).
                select({ guests: 1 }).
                exec().
                then(function (event) {
                  expect(event.guests).to.have.lengthOf(totalGuests);
                  done();
                }).
                catch(function (error) {
                  done(error);
                });
            });
      	});
      });
    });

  });

  describe('PUT /api/events/:event_id', function () {
  	var validEvent = null;
  	var access_token;
    var oldTitle = 'Old title';
    var totalGuests = 3;
    var validGuests = null;

	  before(function(done){
      // create event
    	var event = factory.create("event", {title: oldTitle, admin: validUser._id}, function(error, event) {
        if (error) return done(error);

        validEvent = event;

        done();
      });

    });

    // create guests
    before(function (done) {
      factory.createMany('guest', totalGuests, function (error, guests) {
        if (error) return done(error);

        validGuests = guests;

        done();
      });
    });

	  before(function(done){
		  // Authenticate user
		  request(server)
    		.post('/api/users/authenticate')
				.send({ email: validUser.email, password: password })
        .end(function(error, response) {
          if (error) return done(error);

			    access_token = response.body.token;

          done();
        });
    });

  	it('responds with status 403 if token is not present', function (done) {
    	request(server)
    	  .put('/api/events/' + validEvent._id)
    		.expect('Content-Type', /json/)
				.expect(403)
        .end(function(error, response) {
          if (error) return done(error);

          expect(response.body.message).to.equal("No token provided.");

          done();
        });
    });

    it('responds with status 403 if token is invalid', function (done) {
    	request(server)
    	  .put('/api/events/' + validEvent._id)
    		.set('x-access-token', 'invalidtoken')
    		.expect('Content-Type', /json/)
				.expect(403)
        .end(function(error, response) {
          if (error) return done(error);

          expect(response.body.message).to.equal("Failed to authenticate token.");

          done();
        });
    });

    it('responds with status 403 if user is not admin', function (done) {
      factory.create('user', function (error, user) {
        factory.create('event', {admin: user._id}, function (error, event) {
          if (error) return done(error);

        	request(server)
        	  .put('/api/events/' + event._id)
	          .set('x-access-token', access_token)
        		.expect('Content-Type', /json/)
				    .expect(403)
            .end(function(error, response) {
              if (error) return done(error);

              expect(response.body.message).to.equal("User does not have permission to update this event.");

              done();
            });
        });
      });
    });

    it('responds with status 404 if event doesn\'t exits', function (done) {
      factory.build('event', function (error, event) {
      	request(server)
      	  .put('/api/events/' + event._id)
          .set('x-access-token', access_token)
      		.expect('Content-Type', /json/)
		      .expect(404)
          .end(function(error, response) {
            if (error) return done(error);

            expect(response.body.message).to.equal("Event not found.");

            done();
          });
      });
    });

    it('responds with error if some validation fails', function (done) {
    	request(server)
      	.put('/api/events/' + validEvent._id)
    		.set('x-access-token', access_token)
				.send({ description: null })
				.expect('Content-Type', /json/)
				.expect(400)
        .end(function(error, response) {
          if (error) return done(error);

					expect(response.body.errors.description.message).to.equal('Description is required.');

          done();
        });
    });

  	it('responds with success if event title is updated', function (done) {
      var newTitle = 'New title';

      expect(validEvent.title).to.equal(oldTitle);

    	request(server)
    	  .put('/api/events/' + validEvent._id)
        .send({ title: newTitle })
	      .set('x-access-token', access_token)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(error, response) {
          if (error) return done(error);

          Event.
            findById(validEvent._id).
            select({
              title: 1
            }).
            exec().
            then(function (event) {
              expect(event.title).to.equal(newTitle);
              done();
            }).
            catch(done);

        });
    });

  	it('responds with success if event guests are added', function (done) {
    	request(server)
    	  .put('/api/events/' + validEvent._id)
        .send({ guests: validGuests })
        .set('x-access-token', access_token)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(error, response) {
          if (error) return done(error);

          Event.
            findById(validEvent._id).
            select({
              guests: 1
            }).
            exec().
            then(function (event) {
              expect(event.guests).to.have.lengthOf(totalGuests);
              done();
            }).
            catch(done);

        });
    });

  	it('responds with success if an event guest is removed', function (done) {
      // remove first event guest
      var removedGuest = validGuests.splice(0, 1)[0];

    	request(server)
    	  .put('/api/events/' + validEvent._id)
        .send({ guests: validGuests })
        .set('x-access-token', access_token)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(error, response) {
          if (error) return done(error);

          Event.
            findById(validEvent._id).
            select({
              guests: 1
            }).
            populate({
              path: 'guests'
            }).
            exec().
            then(function (event) {
              expect(event.guests).to.have.lengthOf(totalGuests - 1);
              event.guests.forEach(function (guest) {
                expect(guest.user).not.to.equal(removedGuest.user.toString());
              });
              done();
            }).
            catch(done);

        });

    });

  });

  describe('GET /api/events/:event_id', function () {
  	var validEvent = null;
  	var access_token;

	  before(function(done){
      // create event
    	var event = factory.create("event", function(error, event) {
        if (error) return done(error);

        validEvent = event;

        done();
      });

    });

	  before(function(done){
		  // Authenticate user
		  request(server)
    		.post('/api/users/authenticate')
				.send({ email: validUser.email, password: password })
        .end(function(error, response) {
          if (error) return done(error);

			    access_token = response.body.token;

          done();
        });
    });

  	it('responds with status 403 if token is not present', function (done) {
    	request(server)
    	  .get('/api/events/' + validEvent._id)
    		.expect('Content-Type', /json/)
				.expect(403)
        .end(function(error, response) {
          if (error) return done(error);

          expect(response.body.message).to.equal("No token provided.");

          done();
        });
    });

    it('responds with status 403 if token is invalid', function (done) {
    	request(server)
    	  .get('/api/events/' + validEvent._id)
    		.set('x-access-token', 'invalidtoken')
    		.expect('Content-Type', /json/)
				.expect(403)
        .end(function(error, response) {
          if (error) return done(error);

          expect(response.body.message).to.equal("Failed to authenticate token.");

          done();
        });
    });

  	it('responds with status 404 if event doesn\'t exist', function (done) {
      factory.build('event', function (error, event) {
        if (error) return done(error);

      	request(server)
      	  .get('/api/events/' + event._id)
	        .set('x-access-token', access_token)
          .expect('Content-Type', /json/)
          .expect(404)
          .end(function(error, response) {
            if (error) return done(error);

            expect(response.body.event).to.be.null;

            done();
          });

      });
    });

  	it('responds with status 400 if invalid event id is passed', function (done) {
      factory.build('event', function (error, event) {
        if (error) return done(error);

      	request(server)
      	  .get('/api/events/notValid')
	        .set('x-access-token', access_token)
          .expect('Content-Type', /json/)
          .expect(400)
          .end(function(error, response) {
            if (error) return done(error);

            expect(response.body.errors.event.message).to.equal("Invalid Event Id.");

            done();
          });

      });
    });

  	it('responds with success if event is retrieved', function (done) {
    	request(server)
    	  .get('/api/events/' + validEvent._id)
	      .set('x-access-token', access_token)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(error, response) {
          if (error) return done(error);

          expect(response.body.event._id).to.equal(validEvent._id.toString());

          done();
        });
    });

  });

  describe('DELETE /api/events/:event_id', function () {
  	var validEvent = null;
  	var access_token;
    var totalGuests = 3;
    var validGuests = null;

	  before(function(done){
      // create event
    	var event = factory.create("event", {admin: validUser._id}, function(error, event) {
        if (error) return done(error);

        validEvent = event;

        done();
      });

    });

    // create guests
    before(function (done) {
      factory.createMany('guest', totalGuests, function (error, guests) {
        if (error) return done(error);

        validGuests = guests;

        done();
      });
    });

	  before(function(done){
		  // Authenticate user
		  request(server)
    		.post('/api/users/authenticate')
				.send({ email: validUser.email, password: password })
        .end(function(error, response) {
          if (error) return done(error);

			    access_token = response.body.token;

          done();
        });
    });

  	it('responds with status 403 if token is not present', function (done) {
    	request(server)
    	  .delete('/api/events/' + validEvent._id)
    		.expect('Content-Type', /json/)
				.expect(403)
        .end(function(error, response) {
          if (error) return done(error);

          expect(response.body.message).to.equal("No token provided.");

          done();
        });
    });

    it('responds with status 403 if token is invalid', function (done) {
    	request(server)
    	  .delete('/api/events/' + validEvent._id)
    		.set('x-access-token', 'invalidtoken')
    		.expect('Content-Type', /json/)
				.expect(403)
        .end(function(error, response) {
          if (error) return done(error);

          expect(response.body.message).to.equal("Failed to authenticate token.");

          done();
        });
    });


    it('responds with status 403 if user is not admin', function (done) {
      factory.create('user', function (error, user) {
        factory.create('event', {admin: user._id}, function (error, event) {
          if (error) return done(error);

        	request(server)
        	  .delete('/api/events/' + event._id)
	          .set('x-access-token', access_token)
        		.expect('Content-Type', /json/)
				    .expect(403)
            .end(function(error, response) {
              if (error) return done(error);

              expect(response.body.message).to.equal("User does not have permission to delete this event.");

              done();
            });
        });
      });
    });

    it('responds with status 404 if event doesn\'t exits', function (done) {
      factory.build('event', function (error, event) {
      	request(server)
      	  .delete('/api/events/' + event._id)
          .set('x-access-token', access_token)
      		.expect('Content-Type', /json/)
		      .expect(404)
          .end(function(error, response) {
            if (error) return done(error);

            expect(response.body.message).to.equal("Event not found.");

            done();
          });
      });
    });

  	it('removes and responds with success an event', function (done) {
    	request(server)
    	  .delete('/api/events/' + validEvent._id)
	      .set('x-access-token', access_token)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(error, response) {
          if (error) return done(error);

          expect(response.body.message).to.equal("Event deleted!");

          Event.
            findById(validEvent._id).
            exec().
            then(function (event) {
              expect(event).to.be.null;
            }).
            catch(done);

          done();
        });
    });

  });



  describe('GET /api/events', function () {
  	var access_token;
    var validEvent = null;

	  before(function(done){
      // create event
    	var event = factory.create("event", {admin: validUser._id}, function(error, event) {
        if (error) return done(error);

        validEvent = event;

        done();
      });

    });

	  before(function(done){
		  // Authenticate user
		  request(server)
    		.post('/api/users/authenticate')
				.send({ email: validUser.email, password: password })
        .end(function(error, response) {
          if (error) return done(error);

			    access_token = response.body.token;

          done();
        });
    });

  	it('responds with status 403 if token is not present', function (done) {
    	request(server)
    	  .get('/api/events')
    		.expect('Content-Type', /json/)
				.expect(403)
        .end(function(error, response) {
          if (error) return done(error);

          expect(response.body.message).to.equal("No token provided.");

          done();
        });
    });

    it('responds with status 403 if token is invalid', function (done) {
    	request(server)
    	  .get('/api/events')
    		.set('x-access-token', 'invalidtoken')
    		.expect('Content-Type', /json/)
				.expect(403)
        .end(function(error, response) {
          if (error) return done(error);

          expect(response.body.message).to.equal("Failed to authenticate token.");

          done();
        });
    });

    it('responds with success and retrieves empty list if no invitations', function (done) {
    	request(server)
    		.get('/api/events')
    		.set('x-access-token', access_token)
				.expect('Content-Type', /json/)
				.expect(200)
        .end(function(error, response) {
          if (error) return done(error);

					expect(response.body.events).to.be.instanceof(Array);
					expect(response.body.events).to.be.empty;

          done();
        });
    });

    it('responds with success and retrieves event if user has one invitation', function (done) {
      factory.create('event', function (error, event) {
        if (error) done(error);

        // add user as guest
        event.guests.addToSet({ user: validUser._id });

        event.save().
          then(function (event) {
          	request(server)
          		.get('/api/events')
          		.set('x-access-token', access_token)
				      .expect('Content-Type', /json/)
				      .expect(200)
              .end(function(error, response) {
                if (error) return done(error);

					      expect(response.body.events).to.be.instanceof(Array);
					      expect(response.body.events).to.be.lengthOf(1);
					      expect(response.body.events[0].event._id).to.equal(event._id.toString());

                done();
              });
          }).
          catch(done);
      });
    });

/*
    it('does not include events to which the user hasn\'t been invited', function (done) {
    	request(server)
    		.get('/api/guests')
    		.set('x-access-token', access_token)
				.expect('Content-Type', /json/)
				.expect(function(response){
					expect(response.body.guests).to.be.instanceof(Array);
				})
				.expect(200, done);
    });
*/
  });

});
