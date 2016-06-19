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

});
