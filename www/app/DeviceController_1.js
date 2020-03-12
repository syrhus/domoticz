define(['app', 'DashboardFactories'], function (app) {
app.component('deviceComponent', {
	templateUrl: "views/lightswitch_template.html",
	controller: ['$scope','$rootScope','deviceFunctions', function($scope, $rootScope, deviceFunctions) {
		var ctrl = this;
		var item = null;
		var levels = [];
		var _CANCEL = '#CANCEL#';

		ctrl.dashboard = true;
		ctrl.isSelector = false;

		ctrl.getImage = function(){
			var path = "images/";
			var state = item.Status;
			if (this.isSelector)
				state = (item.Status === "Off") ? "Off": "On";
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

		ctrl.imageClick = function(){
			var passcode = this.clickAllow();
			if(passcode === _CANCEL)
				return;

			var switchcmd = this.getCmdStatus();
			clearInterval($.myglobals.refreshTimer);
			ShowNotify($.t('Switching') + ' ' + $.t(switchcmd));

			var urlcmd  = "json.htm?type=command&idx=" + item.idx +
			"&param=switchlight&switchcmd=" +  switchcmd +
			"&level=0" + "&passcode=" + passcode;
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

		ctrl.isAllow = true;

		ctrl.selectorClick = function(lvl){
			var passcode = this.clickAllow();
			if(passcode === _CANCEL)
				return;

			//var switchcmd = getCmdStatus();
			clearInterval($.myglobals.refreshTimer);
			//ShowNotify($.t('Switching') + ' ' + $.t(switchcmd));

			var urlcmd  = "json.htm?type=command&idx=" + item.idx +
			"&param=switchlight&switchcmd=Set%20Level&level=" + lvl +
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

		setItem = function(val){
			item = val;
			ctrl.isSelector = IsSelector(item);
			if(ctrl.isSelector)
				setLevels(item);
		};


		ctrl.$onChanges = function(changes){
			if(changes != null && changes.device != null){
				setItem(changes.device.currentValue);
			}
		};

		ctrl.$onInit = function(){
			setItem(ctrl.device);
		};

		//////////////
		SwitchLightInt =function(idx, switchcmd, refreshfunction, passcode) {
			clearInterval($.myglobals.refreshTimer);

			ShowNotify($.t('Switching') + ' ' + $.t(switchcmd));

			$.ajax({
				url: "json.htm?type=command&param=switchlight" +
				"&idx=" + idx +
				"&switchcmd=" + switchcmd +
				"&level=0" +
				"&passcode=" + passcode,
				async: false,
				dataType: 'json',
				success: function (data) {
					if (data.status == "ERROR") {
						HideNotify();
						bootbox.alert($.t(data.message));
					}
					//wait 1 second
					setTimeout(function () {
						HideNotify();
						refreshfunction();
					}, 1000);
				},
				error: function () {
					HideNotify();
					bootbox.alert($.t('Problem sending switch command'));
				}
			});
		}

		SwitchLight=function(idx, switchcmd, refreshfunction) {

			var passcode = "";
			if (typeof isprotected != 'undefined') {
				if (isprotected == true) {
					bootbox.prompt($.t("Please enter Password") + ":", function (result) {
						if (result === null) {
							return;
						} else {
							if (result == "") {
								return;
							}
							passcode = result;
							SwitchLightInt(idx, switchcmd, refreshfunction, passcode);
						}
					});
				}
				else {
					SwitchLightInt(idx, switchcmd, refreshfunction, passcode);
				}
			}
			else {
				SwitchLightInt(idx, switchcmd, refreshfunction, passcode);
			}
		}

		SwitchSelectorLevelInt = function(idx, levelName, levelValue, refreshfunction, passcode) {
			clearInterval($.myglobals.refreshTimer);

			ShowNotify($.t('Switching') + ' ' + levelName);

			$.ajax({
				url: "json.htm?type=command&param=switchlight" +
				"&idx=" + idx +
				"&switchcmd=Set%20Level&level=" + levelValue +
				"&passcode=" + passcode,
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
						refreshfunction();
					}, 1000);
				},
				error: function () {
					HideNotify();
					bootbox.alert($.t('Problem sending switch command'));
				}
			});
		}

		SwitchSelectorLevel = function(idx, levelName, levelValue, refreshfunction, isprotected) {
			var passcode = "";
			if (typeof isprotected != 'undefined') {
				if (isprotected == true) {
					bootbox.prompt($.t("Please enter Password") + ":", function (result) {
						if (result === null) {
							return;
						} else {
							if (result == "") {
								return;
							}
							passcode = result;
							SwitchSelectorLevelInt(idx, levelName, levelValue, refreshfunction, passcode);
						}
					});
				}
				else {
					SwitchSelectorLevelInt(idx, levelName, levelValue, refreshfunction, passcode);
				}
			}
			else {
				SwitchSelectorLevelInt(idx, levelName, levelValue, refreshfunction, passcode);
			}
		}

		SwitchSceneInt = function(idx, switchcmd, refreshfunction, passcode) {
			clearInterval($.myglobals.refreshTimer);
			ShowNotify($.t('Switching') + ' ' + $.t(switchcmd));

			$.ajax({
				url: "json.htm?type=command&param=switchscene&idx=" + idx +
				"&switchcmd=" + switchcmd +
				"&passcode=" + passcode,
				async: false,
				dataType: 'json',
				success: function (data) {
					if (data.status == "ERROR") {
						HideNotify();
						bootbox.alert($.t(data.message));
					}
					//wait 1 second
					setTimeout(function () {
						HideNotify();
						refreshfunction();
					}, 1000);
				},
				error: function () {
					HideNotify();
					bootbox.alert($.t('Problem sending switch command'));
				}
			});
		}

		SwitchScene = function(idx, switchcmd, refreshfunction, isprotected) {
			var passcode = "";
			if (typeof isprotected != 'undefined') {
				if (isprotected == true) {
					bootbox.prompt($.t("Please enter Password") + ":", function (result) {
						if (result === null) {
							return;
						} else {
							if (result == "") {
								return;
							}
							passcode = result;
							SwitchSceneInt(idx, switchcmd, refreshfunction, passcode);
						}
					});
				}
				else {
					SwitchSceneInt(idx, switchcmd, refreshfunction, passcode);
				}
			}
			else {
				SwitchSceneInt(idx, switchcmd, refreshfunction, passcode);
			}
		}

		/////////
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
