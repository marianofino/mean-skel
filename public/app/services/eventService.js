angular.module("services")
	.factory("Event", ['$http', '$window', 'config', function($http, $window, config) {
		var eventFactory = {};

		// create an event
		eventFactory.create = function(eventData) {
			return $http.post(config.api_url + "/events/", eventData);
		};

		// get events for this admin
		eventFactory.getAdminList = function() {
			return $http.get(config.api_url + "/user/events/");
		};

		return eventFactory;
	}]);
