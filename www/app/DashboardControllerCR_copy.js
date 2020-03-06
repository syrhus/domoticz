define(['app', 'DeviceController', 'DashboardFactories'], function (app) {

	app.controller('DashboardControllerCR', ['$scope', '$rootScope', '$interval', 'apiDashboard', function ($scope, $rootScope, $interval, apiDashboard) {

		var vm = $scope;
		$scope.devices = [];

		$scope.getIncludeFile = function(device) {
		    // Make this more dynamic, but you get the idea
				if(device.IsLightSwitch())
            return 'views/lightswitch_template.html';
			  else {
			  	return  'views/utility_template.html';
			  }

		}

		$scope.ResizeDimSliders = function () {
			var nobj = $("#dashcontent #name");
			if (typeof nobj == 'undefined') {
				return;
			}
			var width = $("#dashcontent #name").width() - 40;
			$("#dashcontent .span4 .dimslidernorm").width(width);
			//width=$(".span3").width()-70;
			$("#dashcontent .span3 .dimslidernorm").width(width);
			width = $(".mobileitem").width() - 63;
			$("#dashcontent .mobileitem .dimslidernorm").width(width);

			width = $("#dashcontent #name").width() - 40;
			//width=$(".span4").width()-118;
			$("#dashcontent .span4 .dimslidersmall").width(width);
			//width=$(".span3").width()-112;
			$("#dashcontent .span3 .dimslidersmall").width(width);
			width = $(".mobileitem").width() - 63;
			$("#dashcontent .mobileitem .dimslidersmall").width(width);

			width = $("#dashcontent #name").width() - 85;
			$("#dashcontent .span4 .dimslidersmalldouble").width(width);
			$("#dashcontent .span3 .dimslidersmalldouble").width(width);
		}

		var bFavorites = 1;

		$scope.getDevices = function(){
			apiDashboard.getFavorites(bFavorites).then(function(response){
				$scope.LastUpdateTime = response.ActTime;
				$scope.devices = response.result;
		})};

		this.$onInit = function(){

			$(window).resize(function () { $scope.ResizeDimSliders(); });
			$scope.LastUpdateTime = parseInt(0);
			$scope.MakeGlobalConfig();

			if (typeof window.myglobals.LastPlanSelected != 'undefined') {
				if (window.myglobals.LastPlanSelected > 0) {
					bFavorites = 0;
				}
			}

			$rootScope.RefreshTimeAndSun();
			$scope.getDevices();

			$scope.mytimer = $interval(function () {
				$rootScope.RefreshTimeAndSun();
				//$scope.getDevices();
			}, 10000);
		};

		$scope.$on('$destroy', function () {
			if (typeof $scope.mytimer != 'undefined') {
				$interval.cancel($scope.mytimer);
				$scope.mytimer = undefined;
			}
			$(window).off("resize");
			var popup = $("#rgbw_popup");
			if (typeof popup != 'undefined') {
				popup.hide();
			}
			popup = $("#setpoint_popup");
			if (typeof popup != 'undefined') {
				popup.hide();
			}
			popup = $("#thermostat3_popup");
			if (typeof popup != 'undefined') {
				popup.hide();
			}
		});
	}]);
	app.controller('DeviceController',function (){
	  var ctrl = this;

	  ctrl.change = function() {
	    ctrl.onUpdate({device: ctrl.device, prop: 'name', value: 'Toto'});
	  };
	});
	app.component('favorites', {
	  template:"<ul id='devices'><device ng-repeat='device in $ctrl.devices' device='device'></device></ul>",
	  controller: app.DashboardControllerCR
	});
	app.component('device', {
	  templateUrl: "views/lightswitch_template.html",
	  controller: app.DeviceController,
	  bindings: {
	    device: '<'
	  }
	});
});
