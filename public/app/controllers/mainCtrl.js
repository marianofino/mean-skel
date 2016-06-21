angular.module("controllers")
  .controller("mainController", ['$location', 'Auth', 'flash', 'config', function($location, Auth, flash, config){
    var vm = this;
    vm.auth = Auth;

    vm.startup = function () {
      var pending = vm.getRemotePending();
		  flash.setMessage("Welcome back, " + vm.loginData.email + "! You have " + pending + " pending invitations.");
    };

    vm.getRemotePending = function () {
      var user = vm.auth.getCurrentUser();

      var pending = user.invitations.filter(function (invitation) {
        return invitation.status.answered == false && new Date(invitation.date) > Date.now();
      });

      return pending.length;
    };

    vm.doLogin = function() {
      vm.processing = true;

      Auth.login(vm.loginData.email, vm.loginData.password).then(function(response){
          vm.processing = false;
          vm.startup();
          // fire startup actions
					$location.path(config.main_path);

        }, function(response) {
          vm.processing = false;
					flash.setErrors(response.data);
				});
    };

    vm.doLogout = function() {
      Auth.logout();
    };

  }]);
