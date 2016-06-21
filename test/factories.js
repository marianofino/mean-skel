var factory = require('factory-girl'),
	MongooseAdapter = require('factory-girl-mongoose').MongooseAdapter,
	User = require('../app/models/user'),
	Event = require('../app/models/event'),
	faker = require('faker');

factory.setAdapter(MongooseAdapter);

var register = function() {
	// User factory
	factory.define('user', User, {
		email: function() {
			return faker.internet.email();
		},
		password: faker.internet.password(),
		firstname: faker.name.firstName(),
		lastname: faker.name.lastName(),
    invitations: []
	});

  // TODO: change mongoose promise
	// Event factory
	factory.define('event', Event, {
    // date should be very long in the future for better reliability in the tests
		date: faker.date.future(1),
		title: faker.lorem.sentence(),
		description: faker.lorem.paragraph(),
    admin: factory.assoc('user', '_id'),
    guests: []
	});

  // Guest sub-document factory (no model, just schema)
  factory.setAdapter(new factory.ObjectAdapter(), 'guest');
	factory.define('guest', {}, {
    user: factory.assoc('user', '_id')
	});

  // Invitation sub-document factory (no model, just schema)
  factory.setAdapter(new factory.ObjectAdapter(), 'invitation');
	factory.define('invitation', {}, {
    event: factory.assoc('event', '_id'),
    date: faker.date.future(1)
	});

}

module.exports.register = register;
