angular.module("services")
	.factory("Event", ['$http', '$window', 'config', function($http, $window, config) {
		var eventFactory = {};

		// create an event
		eventFactory.create = function(eventData) {
			return $http.post(config.api_url + "/events/", eventData);
		};

		return eventFactory;
	}]);
