define(['app', 'DashboardFactories','timers/factories','timers/planning140'], function (app) {
app.component('deviceComponent', {
	templateUrl: "views/lightswitch_template.html",
	//controller: ['$scope','$rootScope','deviceFunctions', function($scope, $rootScope, deviceFunctions) {
	controller: ['$scope','$rootScope','$element','deviceFunctions','deviceRegularTimersApi', function($scope, $rootScope, $element, deviceFunctions, deviceRegularTimersApi) {
		var ctrl = this;
		var item = null;
		var levels = [];
		var planning = null;
		var _CANCEL = '#CANCEL#';

		ctrl.dashboard = false;
		ctrl.isSelector = false;

		ctrl.getImage = function(){
			var path = "images/";
			var state = item.Status;
			if (this.isSelector)
				state = (item.LevelInt === 0) ? "Off": "On";
			else if ((item.Type == "Thermostat") && (item.SubType == "SetPoint"))
				return path += 'override.png';
			else if (deviceFunctions.IsScene(item)){
				return path += 'push48.png';
			}

			return path += item.Image + "48_" + state +".png";
		};

		ctrl.getCmdStatus = function(){
			return (item.Status === "Off") ? "On": "Off";
		};

		ctrl.getItemClass = function(css){
			return css + (ctrl.dashboard ? " footer": "");
		};

		ctrl.getBatteryVisible = function(){
			if(item.BatteryLevel  != undefined)
				return (item.BatteryLevel != 255)
			else
				return false;
		};

		ctrl.getImageClasses = function(){
			/*if (deviceFunctions.IsScene(item)){
				if (item.Status == 'On')
					return "transimg";
				else if (item.Status == 'Off')
					return "transimg";
			}*/
		};

		ctrl.getStatus = function(){
			if (item.SwitchType === "Selector")
				return b64DecodeUnicode(item.LevelNames).split('|')[(item.LevelInt / 10)];
			else if ((item.Type == "Thermostat") && (item.SubType == "SetPoint")
				|| item.SubType == "Smartwares")
				return item.Data + '\u00B0 ' + $rootScope.config.TempSign;
			else return item.Status;
		};

		ctrl.getInfo =function(){
			return $.t('Last Seen') + ' : ' + item.LastUpdate;
		};

		ctrl.getLevels = function(){
			return levels;
		};

    ctrl.clickAllow = function(){
			if (window.my_config.userrights == 0) {
				HideNotify();
				ShowNotify($.t('You do not have permission to do that!'), 2500, true);
				return _CANCEL;
			}

			var passcode = "";
			if (typeof item.Protected != 'undefined') {
				if (item.Protected == true) {
					bootbox.prompt($.t("Please enter Password") + ":", function (result) {
						if (result === null || result === "")
							return _CANCEL;
						else
							passcode = result;
					});
				}
			}
			return passcode;
		};

		ctrl.isAllow = true;

    ctrl.Click= function(lvl){
			var passcode = this.clickAllow();
			if(passcode === _CANCEL)
				return;

			var switchcmd = "";
			if(lvl != undefined && lvl.value !== undefined){
				switchcmd = "Set%20Level&level=" + lvl.value;
				item.LevelInt = lvl.value;
			}
			else{
				switchcmd = ctrl.getCmdStatus();
			  item.Status = switchcmd;
			}

			ShowNotify($.t('Switching') + ' ' + ((lvl != undefined && lvl.value !== undefined) ? lvl.label : switchcmd) );

			var urlcmd  = "json.htm?type=command&idx=" + item.idx +
			"&param=switchlight" +
			"&switchcmd=" +  switchcmd +
			"&passcode=" + passcode;

			$.ajax({
				url: urlcmd,
				async: true,
				dataType: 'json',
				success: function (data) {
					if (data.status == "ERROR") {
						HideNotify();
						bootbox.alert($.t(data.message));
					}
					//wait 1 second
					setTimeout(function () {
						HideNotify();
						//refreshfunction();
					}, 1500);
				},
				error: function () {
					HideNotify();
					bootbox.alert($.t('Problem sending switch command'));
				}
			});
		};

		IsSelector = function(val){
			return (val.SwitchType === "Selector");
		};

		setLevels = function(item){
			if(item.LevelNames){
				levels =  b64DecodeUnicode(item.LevelNames).split('|').map(function (levelName, index) {
						return {
								label: levelName,
								value: (index) * 10
						}
				});
				if (item.LevelOffHidden)
					levels.shift();
			}
		};

		ctrl.isSelectedLevel = function(index){
			return (index*10 === ctrl.device.LevelInt);
		}

		setItem = function(val){
			item = val;
			setPlanning();
			ctrl.isSelector = IsSelector(item);
			if(ctrl.isSelector)
				setLevels(item);
		};

		setPlanning = function(){
			var options = {"devid":item.idx, "refreshCallback":null, "viewThumbnail":true, "container":$element, "propValue": "Cmd", "modes": [{"value":0,"name":$.t("On"), "class":"green"},{"value":1,"name":$.t("Off"), "class":"red"}]};
			planning  = new PlanningTimerSheet(options);
			deviceRegularTimersApi.getTimers(item.idx).then(function (items) {
				planning.loadPlanning(items);
					//$element.trigger( "timersLoaded", [items] );//<===Update for Planning
			});
		};

		ctrl.$onChanges = function(changes){
			if(changes != null && changes.device != null){
				setItem(changes.device.currentValue);
			}
		};

		ctrl.$onInit = function(){
			setItem(ctrl.device);
		};
	}],
	bindings: {
		device: '<'
	}
});

app.component('utilityComponent', {
	templateUrl: "views/utility_template.html",
	controller: ['$scope','$rootScope','$element','deviceFunctions','deviceSetpointTimersApi', function($scope, $rootScope, $element, deviceFunctions, deviceSetpointTimersApi) {
		var ctrl = this;
		var item = null;
		var levels = [];
		var planning = null;
		var _CANCEL = '#CANCEL#';

		ctrl.dashboard = true;

		ctrl.getImage = function(){
			var path = "images/";
			var state = item.Status;
			if ((item.Type == "Thermostat") && (item.SubType == "SetPoint"))
				return path += 'override.png';
			else if (deviceFunctions.IsScene(item)){
				return path += 'push48.png';
			}

			return path += item.Image + "48_" + state +".png";
		};

		ctrl.getCmdStatus = function(){
			return (item.Status === "Off") ? "On": "Off";
		};

		ctrl.getItemClass = function(css){
			return css + (ctrl.dashboard ? " footer": "");
		};

		ctrl.getBatteryVisible = function(){
			if(item.BatteryLevel  != undefined)
				return (item.BatteryLevel != 255)
			else
				return false;
		};

		ctrl.getImageClasses = function(){
			/*if (deviceFunctions.IsScene(item)){
				if (item.Status == 'On')
					return "transimg";
				else if (item.Status == 'Off')
					return "transimg";
			}*/
		};

		ctrl.getStatus = function(){
			if ((item.Type == "Thermostat") && (item.SubType == "SetPoint")
				|| item.SubType == "Smartwares")
				return item.Data + '\u00B0 ' + $rootScope.config.TempSign;
			else return item.Status;
		};

		ctrl.getInfo =function(){
			return $.t('Last Seen') + ' : ' + item.LastUpdate;
		};

    ctrl.clickAllow = function(){
			if (window.my_config.userrights == 0) {
				HideNotify();
				ShowNotify($.t('You do not have permission to do that!'), 2500, true);
				return _CANCEL;
			}

			var passcode = "";
			if (typeof item.Protected != 'undefined') {
				if (item.Protected == true) {
					bootbox.prompt($.t("Please enter Password") + ":", function (result) {
						if (result === null || result === "")
							return _CANCEL;
						else
							passcode = result;
					});
				}
			}
			return passcode;
		};

		ctrl.isAllow = true;

    ctrl.Click= function(){
			var passcode = this.clickAllow();
			if(passcode === _CANCEL)
				return;

			var switchcmd = ctrl.getCmdStatus();
		  item.Status = switchcmd;

			ShowNotify($.t('Switching') + ' ' + switchcmd );

			var urlcmd  = "json.htm?type=command&idx=" + item.idx +
			"&param=switchlight" +
			"&switchcmd=" +  switchcmd +
			"&passcode=" + passcode;

			$.ajax({
				url: urlcmd,
				async: true,
				dataType: 'json',
				success: function (data) {
					if (data.status == "ERROR") {
						HideNotify();
						bootbox.alert($.t(data.message));
					}
					//wait 1 second
					setTimeout(function () {
						HideNotify();
						//refreshfunction();
					}, 1500);
				},
				error: function () {
					HideNotify();
					bootbox.alert($.t('Problem sending switch command'));
				}
			});
		};

		setItem = function(val){
			item = val;
			setPlanning();
		};

		setPlanning = function(){
			var options = {"devid":item.idx, "refreshCallback":null, "viewThumbnail":true, "container":$element };
			planning  = new PlanningTimerSheet(options);
			deviceSetpointTimersApi.getTimers(item.idx).then(function (items) {
				planning.loadPlanning(items);
					//$( document ).trigger( "timersLoaded", [items] );//<===Update for Planning
			});
		};

		ctrl.$onChanges = function(changes){
			if(changes != null && changes.device != null){
				setItem(changes.device.currentValue);
			}
		};

		ctrl.$onInit = function(){
			setItem(ctrl.device);
		};
	}],
	bindings: {
		device: '<'
	}
});

});


/*
	app.controller('DeviceController', ['$scope', '$rootScope', '$location', '$http', '$interval', 'permissions', function ($scope, $rootScope, $location, $http, $interval, permissions) {

		var vm = $scope.device;

		$scope.LastUpdateTime = parseInt(0);


		$scope.templateItem = "views/lightswitch_template.html";
		$scope.dashboard = false;
		$scope.isSelector = function(){
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

		$scope.getImage = function(){
			var path = "images/";
			var state = vm.Status;
			if (this.isSelector())
				state = (vm.Status === "Off") ? "Off": "On";
			else if ((vm.Type == "Thermostat") && (vm.SubType == "SetPoint"))
				return path += 'override.png';

			return path += vm.Image + "48_" + state +".png";
		};
		$scope.getStatus = function(){
			if ((vm.Type == "Thermostat") && (vm.SubType == "SetPoint")
				|| vm.SubType == "Smartwares") {
				return vm.Data + '\u00B0 ' + $scope.config.TempSign;
			}
			else {
				return vm.Status;
			}
		};

		$scope.getInfo =function(){
			return vm.LastUpdate;
		};

		$scope.getLevels = function(){
			return vm.LevelNames ? b64DecodeUnicode(vm.LevelNames).split('|') : [];
		};

		$scope.imageClick = function(){

		};

		$scope.isAllow = true;

		$scope.selectorClick = function(){

		};

	}]);
});
*/
