angular.module("services")
	.factory("Event", ['$http', '$window', 'config', function($http, $window, config) {
		var eventFactory = {};

		// create an event
		eventFactory.create = function(eventData) {
			return $http.post(config.api_url + "/events/", eventData);
		};

		// update an event
		eventFactory.update = function(eventData) {
			return $http.put(config.api_url + "/events/" + eventData._id, eventData);
		};

		// create an event
		eventFactory.getById = function(eventId) {
			return $http.get(config.api_url + "/events/" + eventId);
		};

		// get events for this admin
		eventFactory.getAdminList = function() {
			return $http.get(config.api_url + "/user/events/");
		};

		// cancel event
		eventFactory.remove = function(eventId) {
			return $http.delete(config.api_url + "/events/" + eventId);
		};

		return eventFactory;
	}]);
