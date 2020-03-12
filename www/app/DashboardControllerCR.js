
define(['app', 'DeviceController', 'DashboardFactories'], function (app) {
	app.controller('DashboardControllerCR', ['$scope', '$rootScope', '$interval', 'apiDashboard','deviceFunctions',  function ($scope, $rootScope, $interval, apiDashboard, deviceFunctions) {
		var $ctrl = this;
		var vm = $scope;
		//$ctrl.devices = [{"Name":"Toto"},{"Name":"Titi"}];
		$scope.devices = [];
		$scope.scenes = [];
		$scope.switches = [];
		$scope.sensors = [];

		var bFavorites = 1;

		$scope.filterScenes = function(item){
			return deviceFunctions.IsScene(item);
		};

		$scope.filterSwitches = function(item){
			return (deviceFunctions.IsLigthSwitch(item) && !item.Name.startsWith("Chauffage"));
		};

		$scope.filterHeaters = function(item){
			return (deviceFunctions.IsLigthSwitch(item) && item.Name.startsWith("Chauffage"));
		};

		$scope.filterSensors = function(item){
			return deviceFunctions.IsTempSensor(item);
		};

		$scope.filterUtilities = function(item){
			return deviceFunctions.IsUtility(item);
		};
		getDevices = function(){
			apiDashboard.getFavorites(bFavorites).then(function(response){
				$scope.LastUpdateTime = response.ActTime;
				var result = response.result;
				if($scope.devices.length == 0)
					$scope.devices = result;
				else {
					for(var i = 0; i< result.length ;i++){
						var d = result[i];
						var prevIndex = -1;
						var prev = $scope.devices.find(function(dev,index){
							var ret = (dev.ID === d.ID);
							if(ret)
								prevIndex = index;
							return ret;
						});
						if(prev != null && prev.LastUpdate !== d.LastUpdate){
							for (var property in d) {
    						if (d.hasOwnProperty(property)) {
							        prev[property] = d[property];
							  }
							}
						}
					}
				}
		})};


		init = function(){

			$scope.LastUpdateTime = parseInt(0);
			$scope.MakeGlobalConfig();

			if (typeof window.myglobals.LastPlanSelected != 'undefined') {
				if (window.myglobals.LastPlanSelected > 0) {
					bFavorites = 0;
				}
			}

			$rootScope.RefreshTimeAndSun();
			getDevices();

			$scope.mytimer = $interval(function () {
				$rootScope.RefreshTimeAndSun();
				getDevices();
			}, 50000);
		};

		init();

	}]);

	/*
	app.component('device', {
		templateUrl: "views/lightswitch_template.html",
		//template:"<div ng-class='{'item':true, 'footer':!dashboard}'>	<div class='name bold'>{{$ctrl.device.Name}}</div></div>",
		controller: ['$rootScope', function($rootScope) {
		  var ctrl = this;
			var vm = null;

			ctrl.dashboard = false;
			ctrl.isSelector = function(){
				return vm.SwitchType === 'Selector';
			}

			IsLigthSwitch = function(){
				return (
					(vm.Type.indexOf('Light') == 0) ||
					(vm.Type.indexOf('Blind') == 0) ||
					(vm.Type.indexOf('Curtain') == 0) ||
					(vm.Type.indexOf('Thermostat 2') == 0) ||
					(vm.Type.indexOf('Thermostat 3') == 0) ||
					(vm.Type.indexOf('Chime') == 0) ||
					(vm.Type.indexOf('Color Switch') == 0) ||
					(vm.Type.indexOf('RFY') == 0) ||
					(vm.Type.indexOf('ASA') == 0) ||
					(vm.SubType == "Smartwares Mode") ||
					(vm.SubType == "Relay") ||
					((typeof vm.SubType != 'undefined') && (vm.SubType.indexOf('Itho') == 0)) ||
					((typeof vm.SubType != 'undefined') && (vm.SubType.indexOf('Lucci') == 0))
				)
			};

			IsTempSensor = function(){
				return ((typeof item.Temp != 'undefined') || (typeof item.Humidity != 'undefined') || (typeof item.Chill != 'undefined'));
			};

			ctrl.getImage = function(){
				var path = "images/";
				var state = vm.Status;
				if (this.isSelector())
					state = (vm.Status === "Off") ? "Off": "On";
				else if ((vm.Type == "Thermostat") && (vm.SubType == "SetPoint"))
					return path += 'override.png';

				return path += vm.Image + "48_" + state +".png";
			};
			ctrl.getStatus = function(){
				if ((vm.Type == "Thermostat") && (vm.SubType == "SetPoint")
					|| vm.SubType == "Smartwares") {
					return vm.Data + '\u00B0 ' + $rootScope.config.TempSign;
				}
				else {
					return vm.Status;
				}
			};

			ctrl.getInfo =function(){
				return vm.LastUpdate;
			};

			ctrl.getLevels = function(){
				return vm.LevelNames ? b64DecodeUnicode(vm.LevelNames).split('|') : [];
			};

			ctrl.imageClick = function(){

			};

			ctrl.isAllow = true;

			ctrl.selectorClick = function(){

			};

			ctrl.$onChanges = function(changes){
				if(changes != null && changes.device != null)
					vm = changes.device.currentValue;
			};

			ctrl.$onInit = function(){
				vm = ctrl.device;
			};

		  ctrl.change = function() {
		    ctrl.onUpdate({device: ctrl.device, prop: 'name', value: 'Toto'});
			}
		}],
		bindings: {
			device: '<'
		}
	});*/

	app.component('favorites', {
	  template:"<ul id='devices'><device ng-repeat='device in devices' device='device'></device></ul>",
	  controller: app.DashboardControllerCR
		})
});
