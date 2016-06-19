angular.module("controllers")
  .controller("eventCreateController", ['User', 'Event', '$location', 'flash', 'config', function(User, Event, $location, flash, config) {
    var vm = this;

    // initialize view status
    vm.viewStatus = {
      datepickerOpened: false
    };

    // initialize eventData if empty
    if (typeof vm.eventData === 'undefined')
      vm.eventData = {
        datetime: new Date(),
        guests: []
      };

    // initialize potential event data
    vm.eventPotential = {
      datetime: new Date(),
      guests: []
    };

    // initialize staging data
    if (typeof vm.eventStaging === 'undefined')
      vm.eventStaging = { guest: null };

    // populate possible guests
    User.getGuests()
      .then(function(response) {
        vm.eventPotential.guests = response.data.guests;
      }, function(response) {
			  flash.setErrors(response.data);
		  });

    // show guest info based on _id
    vm.getGuestName = function(guestId) {
      var i = vm.eventPotential.guests.length;
      while (i-- && vm.eventPotential.guests[i]._id != guestId);
      if (i >= 0)
        return vm.eventPotential.guests[i].firstname + ' ' + vm.eventPotential.guests[i].lastname;
      return null;
    }

    // add guest to invitation list
    vm.addGuest = function (guestId) {
      // check if not present already
      var isNotCurrent = function (guest) {
        return guest.user != guestId;
      };
      if (guestId != null && vm.eventData.guests.every(isNotCurrent))
        vm.eventData.guests.push({ user: guestId });
    };

    // remove guests from invitation list
    vm.removeGuest = function (guestId) {
      vm.eventData.guests = vm.eventData.guests.filter(function (guest) {
        return guest.user != guestId;
      });
    };

    // send event to server
    vm.saveEvent = function() {
      vm.processing = true;

      Event.create(vm.eventData)
        .then(function(response) {
          vm.processing = false;
					flash.setMessage(response.data.message);
			    $location.path(config.main_path);
        }, function(response) {
          vm.processing = false;
					flash.setErrors(response.data);
				});

    };
  }]);
