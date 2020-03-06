define(['app','DeviceController', 'DashboardFactories'], function (app) {
	app.controller('LightsController', ['$scope', '$rootScope',  '$interval', 'apiDashboard', function ($scope, $rootScope, $interval, apiDashboard) {
		$scope.HasInitializedAddManualDialog = false;
		var vm = $scope;
		$scope.devices = [];

		$scope.getDevices = function(){
			apiDashboard.getLights().then(function(response){
				$scope.LastUpdateTime = response.ActTime;
				$scope.devices = response.result;
		})};

		MakeFavorite = function (id, isfavorite) {
			if (!permissions.hasPermission("Admin")) {
				HideNotify();
				ShowNotify($.t('You do not have permission to do that!'), 2500, true);
				return;
			}
			if (typeof $scope.mytimer != 'undefined') {
				$interval.cancel($scope.mytimer);
				$scope.mytimer = undefined;
			}
			$.ajax({
				url: "json.htm?type=command&param=makefavorite&idx=" + id + "&isfavorite=" + isfavorite,
				async: false,
				dataType: 'json',
				success: function (data) {
					ShowLights();
				}
			});
		}

		SetColValue = function (idx, color, brightness) {
			clearInterval($.setColValue);
			if (permissions.hasPermission("Viewer")) {
				HideNotify();
				ShowNotify($.t('You do not have permission to do that!'), 2500, true);
				return;
			}
			//TODO: Update local copy of device color instead of waiting for periodic AJAX poll of devices
			$.ajax({
				url: "json.htm?type=command&param=setcolbrightnessvalue&idx=" + idx + "&color=" + color + "&brightness=" + brightness,
				async: false,
				dataType: 'json'
			});
		}

		AddManualLightDevice = function () {
			if (typeof $scope.mytimer != 'undefined') {
				$interval.cancel($scope.mytimer);
				$scope.mytimer = undefined;
			}

			$("#dialog-addmanuallightdevice #combosubdevice").html("");

			$.each($.LightsAndSwitches, function (i, item) {
				var option = $('<option />');
				option.attr('value', item.idx).text(item.name);
				$("#dialog-addmanuallightdevice #combosubdevice").append(option);
			});
			$("#dialog-addmanuallightdevice #comboswitchtype").val(0);
			$("#dialog-addmanuallightdevice").i18n();
			$("#dialog-addmanuallightdevice").dialog("open");
		}

		AddLightDevice = function () {
			if (typeof $scope.mytimer != 'undefined') {
				$interval.cancel($scope.mytimer);
				$scope.mytimer = undefined;
			}

			$("#dialog-addlightdevice #combosubdevice").html("");
			$.each($.LightsAndSwitches, function (i, item) {
				var option = $('<option />');
				option.attr('value', item.idx).text(item.name);
				$("#dialog-addlightdevice #combosubdevice").append(option);
			});

			ShowNotify($.t('Press button on Remote...'));

			setTimeout(function () {
				var bHaveFoundDevice = false;
				var deviceID = "";
				var deviceidx = 0;
				var bIsUsed = false;
				var Name = "";

				$.ajax({
					url: "json.htm?type=command&param=learnsw",
					async: false,
					dataType: 'json',
					success: function (data) {
						if (typeof data.status != 'undefined') {
							if (data.status == 'OK') {
								bHaveFoundDevice = true;
								deviceID = data.ID;
								deviceidx = data.idx;
								bIsUsed = data.Used;
								Name = data.Name;
							}
						}
					}
				});
				HideNotify();

				setTimeout(function () {
					if ((bHaveFoundDevice == true) && (bIsUsed == false)) {
						$.devIdx = deviceidx;
						$("#dialog-addlightdevice").i18n();
						$("#dialog-addlightdevice").dialog("open");
					}
					else {
						if (bIsUsed == true)
							ShowNotify($.t('Already used by') + ':<br>"' + Name + '"', 3500, true);
						else
							ShowNotify($.t('Timeout...<br>Please try again!'), 2500, true);
					}
				}, 200);
			}, 600);
		}

		$scope.ResizeDimSliders = function () {
			var nobj = $("#lightcontent #name");
			if (typeof nobj == 'undefined') {
				return;
			}
			var width = nobj.width() - 50;
			$("#lightcontent .dimslider").width(width);
			$("#lightcontent .dimsmall").width(width - 48);
		}

		$.strPad = function (i, l, s) {
			var o = i.toString();
			if (!s) { s = '0'; }
			while (o.length < l) {
				o = s + o;
			}
			return o;
		};

		UpdateAddManualDialog = function () {
			var lighttype = $("#dialog-addmanuallightdevice #lighttable #combolighttype option:selected").val();
			var bIsARCType = ((lighttype < 20) || (lighttype == 101));
			var bIsType5 = 0;

			var tothousecodes = 1;
			var totunits = 1;
			if ((lighttype == 0) || (lighttype == 1) || (lighttype == 3) || (lighttype == 101)) {
				tothousecodes = 16;
				totunits = 16;
			}
			else if ((lighttype == 2) || (lighttype == 5)) {
				tothousecodes = 16;
				totunits = 64;
			}
			else if (lighttype == 4) {
				tothousecodes = 3;
				totunits = 4;
			}
			else if (lighttype == 6) {
				tothousecodes = 4;
				totunits = 4;
			}
			else if (lighttype == 68) {
				//Do nothing. GPIO uses a custom form
			}
			else if (lighttype == 69) {
				//Do nothing. SysfsGpio uses a custom form
			}
			else if (lighttype == 7) {
				tothousecodes = 16;
				totunits = 8;
			}
			else if (lighttype == 8) {
				tothousecodes = 16;
				totunits = 4;
			}
			else if (lighttype == 9) {
				tothousecodes = 16;
				totunits = 10;
			}
			else if (lighttype == 10) {
				tothousecodes = 4;
				totunits = 4;
			}
			else if (lighttype == 11) {
				tothousecodes = 16;
				totunits = 64;
			}
			else if (lighttype == 106) {
				//Blyss
				tothousecodes = 16;
				totunits = 5;
			}
			else if (lighttype == 70) {
				//EnOcean
				tothousecodes = 128;
				totunits = 2;
			}
			else if (lighttype == 50) {
				//LightwaveRF
				bIsType5 = 1;
				totunits = 16;
			}
			else if (lighttype == 65) {
				//IT (Intertek,FA500,PROmax...)
				bIsType5 = 1;
				totunits = 4;
			}
			else if ((lighttype == 55) || (lighttype == 57)) {
				//Livolo
				bIsType5 = 1;
			}
			else if (lighttype == 100) {
				//Chime/ByronSX
				bIsType5 = 1;
				totunits = 4;
			}
			else if ((lighttype == 102) || (lighttype == 107)) {
				//RFY/RFY2
				bIsType5 = 1;
				totunits = 16;
			}
			else if (lighttype == 103) {
				//Meiantech
				bIsType5 = 1;
				totunits = 0;
			}
			else if (lighttype == 105) {
				//ASA
				bIsType5 = 1;
				totunits = 16;
			}
			else if ((lighttype >= 200) && (lighttype < 300)) {
				//Blinds
			}
			else if (lighttype == 302) {
				//Home Confort
				tothousecodes = 4;
				totunits = 4;
			}
			else if ((lighttype == 400) || (lighttype == 401)) {
				//Openwebnet Bus Blinds/Lights
				totrooms = 11;//area, from 0 to 9 if physical configuration, 0 to 10 if virtual configuration
				totpointofloads = 16;//point of load, from 0 to 9 if physical configuration, 1 to 15 if virtual configuration
				totbus = 10;//maximum 10 local buses
			}
			else if (lighttype == 402) {
				//Openwebnet Bus Auxiliary
				totrooms = 10;
			}
			else if ((lighttype == 403) || (lighttype == 404)) {
				//Openwebnet Zigbee Blinds/Lights
				totunits = 3;//unit number is the button number on the switch (e.g. light1/light2 on a light switch)
			}
			else if (lighttype == 405) {
				//Openwebnet Bus Dry Contact
				totrooms = 200;
			}
			else if (lighttype == 406) {
				//Openwebnet Bus IR Detection
				totrooms = 10;
				totpointofloads = 10
			}

			$("#dialog-addmanuallightdevice #he105params").hide();
			$("#dialog-addmanuallightdevice #blindsparams").hide();
			$("#dialog-addmanuallightdevice #lightingparams_enocean").hide();
			$("#dialog-addmanuallightdevice #lightingparams_gpio").hide();
			$("#dialog-addmanuallightdevice #lightingparams_sysfsgpio").hide();
			$("#dialog-addmanuallightdevice #homeconfortparams").hide();
			$("#dialog-addmanuallightdevice #fanparams").hide();
			$("#dialog-addmanuallightdevice #openwebnetparamsBus").hide();
			$("#dialog-addmanuallightdevice #openwebnetparamsAUX").hide();
			$("#dialog-addmanuallightdevice #openwebnetparamsZigbee").hide();
			$("#dialog-addmanuallightdevice #openwebnetparamsDryContact").hide();
			$("#dialog-addmanuallightdevice #openwebnetparamsIRdetec").hide();

			if (lighttype == 104) {
				//HE105
				$("#dialog-addmanuallightdevice #lighting1params").hide();
				$("#dialog-addmanuallightdevice #lighting2params").hide();
				$("#dialog-addmanuallightdevice #lighting3params").hide();
				$("#dialog-addmanuallightdevice #he105params").show();
			}
			else if (lighttype == 303) {
				$("#dialog-addmanuallightdevice #lighting1params").hide();
				$("#dialog-addmanuallightdevice #lighting2params").show();
				$("#dialog-addmanuallightdevice #lighting3params").hide();
			}
			else if (lighttype == 106) {
				//Blyss
				$('#dialog-addmanuallightdevice #lightparams3 #combogroupcode >option').remove();
				$('#dialog-addmanuallightdevice #lightparams3 #combounitcode >option').remove();
				for (ii = 0; ii < tothousecodes; ii++) {
					$('#dialog-addmanuallightdevice #lightparams3 #combogroupcode').append($('<option></option>').val(41 + ii).html(String.fromCharCode(65 + ii)));
				}
				for (ii = 1; ii < totunits + 1; ii++) {
					$('#dialog-addmanuallightdevice #lightparams3 #combounitcode').append($('<option></option>').val(ii).html(ii));
				}
				$("#dialog-addmanuallightdevice #lighting1params").hide();
				$("#dialog-addmanuallightdevice #lighting2params").hide();
				$("#dialog-addmanuallightdevice #lighting3params").show();
			}
			else if (lighttype == 70) {
				//EnOcean
				$("#dialog-addmanuallightdevice #lightparams_enocean #comboid  >option").remove();
				$("#dialog-addmanuallightdevice #lightparams_enocean #combounitcode  >option").remove();
				for (ii = 1; ii < tothousecodes + 1; ii++) {
					$('#dialog-addmanuallightdevice #lightparams_enocean #comboid').append($('<option></option>').val(ii).html(ii));
				}
				for (ii = 1; ii < totunits + 1; ii++) {
					$('#dialog-addmanuallightdevice #lightparams_enocean #combounitcode').append($('<option></option>').val(ii).html(ii));
				}
				$("#dialog-addmanuallightdevice #lighting1params").hide();
				$("#dialog-addmanuallightdevice #lighting2params").hide();
				$("#dialog-addmanuallightdevice #lighting3params").hide();
				$("#dialog-addmanuallightdevice #lightingparams_enocean").show();
			}
			else if (lighttype == 68) {
				//GPIO
				$("#dialog-addmanuallightdevice #lightparams_enocean #comboid  >option").remove();
				$("#dialog-addmanuallightdevice #lightparams_enocean #combounitcode  >option").remove();
				$("#dialog-addmanuallightdevice #lighting1params").hide();
				$("#dialog-addmanuallightdevice #lighting2params").hide();
				$("#dialog-addmanuallightdevice #lighting3params").hide();
				$("#dialog-addmanuallightdevice #lightingparams_gpio").show();
			}
			else if (lighttype == 69) {
				//SysfsGpio
				$("#dialog-addmanuallightdevice #lightparams_enocean #comboid  >option").remove();
				$("#dialog-addmanuallightdevice #lightparams_enocean #combounitcode  >option").remove();
				$("#dialog-addmanuallightdevice #lighting1params").hide();
				$("#dialog-addmanuallightdevice #lighting2params").show();
				$("#dialog-addmanuallightdevice #lighting3params").hide();
				$("#dialog-addmanuallightdevice #lighting2paramsUnitCode").hide()
				$("#dialog-addmanuallightdevice #lightingparams_sysfsgpio").show();
			}
			else if ((lighttype >= 200) && (lighttype < 300)) {
				//Blinds
				$("#dialog-addmanuallightdevice #blindsparams").show();
				var bShow1 = (lighttype == 205) || (lighttype == 206) || (lighttype == 207) || (lighttype == 210) || (lighttype == 211) || (lighttype == 250) || (lighttype == 226);
				var bShow4 = (lighttype == 206) || (lighttype == 207) || (lighttype == 209);
				var bShowUnit = (lighttype == 206) || (lighttype == 207) || (lighttype == 208) || (lighttype == 209) || (lighttype == 212) || (lighttype == 213) || (lighttype == 250) || (lighttype == 226);
				if (bShow1)
					$('#dialog-addmanuallightdevice #blindsparams #combocmd1').show();
				else {
					$('#dialog-addmanuallightdevice #blindsparams #combocmd1').hide();
					$('#dialog-addmanuallightdevice #blindsparams #combocmd1').val(0);
				}
				if (bShow4)
					$('#dialog-addmanuallightdevice #blindsparams #combocmd4').show();
				else {
					$('#dialog-addmanuallightdevice #blindsparams #combocmd4').hide();
					$('#dialog-addmanuallightdevice #blindsparams #combocmd4').val(0);
				}
				if (bShowUnit)
					$('#dialog-addmanuallightdevice #blindparamsUnitCode').show();
				else
					$('#dialog-addmanuallightdevice #blindparamsUnitCode').hide();

				$("#dialog-addmanuallightdevice #lighting1params").hide();
				$("#dialog-addmanuallightdevice #lighting2params").hide();
				$("#dialog-addmanuallightdevice #lighting3params").hide();
			}
			else if (lighttype == 302) {
				//Home Confort
				$("#dialog-addmanuallightdevice #lighting1params").hide();
				$("#dialog-addmanuallightdevice #lighting2params").hide();
				$("#dialog-addmanuallightdevice #lighting3params").hide();
				$("#dialog-addmanuallightdevice #homeconfortparams").show();
			}
			else if (lighttype == 304) {
				//Fan (Itho)
				$("#dialog-addmanuallightdevice #lighting1params").hide();
				$("#dialog-addmanuallightdevice #lighting2params").hide();
				$("#dialog-addmanuallightdevice #lighting3params").hide();
				$("#dialog-addmanuallightdevice #fanparams").show();
			}
			else if ((lighttype == 305)||(lighttype == 306)) {
				//Fan (Lucci Air)
				$("#dialog-addmanuallightdevice #lighting1params").hide();
				$("#dialog-addmanuallightdevice #lighting2params").hide();
				$("#dialog-addmanuallightdevice #lighting3params").hide();
				$("#dialog-addmanuallightdevice #fanparams").show();
			}
			else if ((lighttype == 400) || (lighttype == 401)) {
				//Openwebnet Bus Blinds/Light
				$("#dialog-addmanuallightdevice #openwebnetparamsBus #combocmd1  >option").remove();
				for (ii = 1; ii < totrooms; ii++) {
					$('#dialog-addmanuallightdevice #openwebnetparamsBus #combocmd1').append($('<option></option>').val(ii).html(ii));
				}
				$("#dialog-addmanuallightdevice #openwebnetparamsBus #combocmd2  >option").remove();
				for (ii = 1; ii < totpointofloads; ii++) {
					$('#dialog-addmanuallightdevice #openwebnetparamsBus #combocmd2').append($('<option></option>').val(ii).html(ii));
				}
				$("#dialog-addmanuallightdevice #openwebnetparamsBus #combocmd3  >option").remove();
				$("#dialog-addmanuallightdevice #openwebnetparamsBus #combocmd3").append($('<option></option>').val(0).html("local bus"));
				for (ii = 1; ii < totbus; ii++) {
					$("#dialog-addmanuallightdevice #openwebnetparamsBus #combocmd3").append($('<option></option>').val(ii).html(ii));
				}

				$("#dialog-addmanuallightdevice #lighting1params").hide();
				$("#dialog-addmanuallightdevice #lighting2params").hide();
				$("#dialog-addmanuallightdevice #lighting3params").hide();
				$("#dialog-addmanuallightdevice #openwebnetparamsBus").show();
			}
			else if (lighttype == 402) {
				//Openwebnet Bus Auxiliary
				$("#dialog-addmanuallightdevice #openwebnetparamsAUX #combocmd1  >option").remove();
				for (ii = 1; ii < totrooms; ii++) {
					$('#dialog-addmanuallightdevice #openwebnetparamsAUX #combocmd1').append($('<option></option>').val(ii).html(ii));
				}
				$("#dialog-addmanuallightdevice #lighting1params").hide();
				$("#dialog-addmanuallightdevice #lighting2params").hide();
				$("#dialog-addmanuallightdevice #lighting3params").hide();
				$("#dialog-addmanuallightdevice #openwebnetparamsAUX").show();
			}
			else if ((lighttype == 403) || (lighttype == 404)) {
				//Openwebnet Zigbee Blinds/Light
				$("#dialog-addmanuallightdevice #lighting1params").hide();
				$("#dialog-addmanuallightdevice #lighting2params").hide();
				$("#dialog-addmanuallightdevice #lighting3params").hide();
				$("#dialog-addmanuallightdevice #openwebnetparamsBus").hide();
				$("#dialog-addmanuallightdevice #openwebnetparamsAUX").hide();
				$("#dialog-addmanuallightdevice #openwebnetparamsZigbee").show();
				$("#dialog-addmanuallightdevice #openwebnetparamsZigbee #combocmd2  >option").remove();
				for (ii = 1; ii < totunits + 1; ii++) {
					$('#dialog-addmanuallightdevice #openwebnetparamsZigbee #combocmd2').append($('<option></option>').val(ii).html(ii));
				}
			}
			else if (lighttype == 405) {
				//Openwebnet Dry Contact
				$("#dialog-addmanuallightdevice #openwebnetparamsDryContact #combocmd1  >option").remove();
				for (ii = 1; ii < totrooms; ii++) {
					$('#dialog-addmanuallightdevice #openwebnetparamsDryContact #combocmd1').append($('<option></option>').val(ii).html(ii));
				}

				$("#dialog-addmanuallightdevice #lighting1params").hide();
				$("#dialog-addmanuallightdevice #lighting2params").hide();
				$("#dialog-addmanuallightdevice #lighting3params").hide();
				$("#dialog-addmanuallightdevice #openwebnetparams").hide();
				$("#dialog-addmanuallightdevice #openwebnetparamsDryContact").show();
			}
			else if (lighttype == 406) {
				//Openwebnet IR Detection
				$("#dialog-addmanuallightdevice #openwebnetparamsIRdetec #combocmd1  >option").remove();
				for (ii = 1; ii < totrooms; ii++) {
					$('#dialog-addmanuallightdevice #openwebnetparamsIRdetec #combocmd1').append($('<option></option>').val(ii).html(ii));
				}
				$("#dialog-addmanuallightdevice #openwebnetparamsIRdetec #combocmd2  >option").remove();
				for (ii = 1; ii < totpointofloads; ii++) {
					$('#dialog-addmanuallightdevice #openwebnetparamsIRdetec #combocmd2').append($('<option></option>').val(ii).html(ii));
				}
				$("#dialog-addmanuallightdevice #lighting1params").hide();
				$("#dialog-addmanuallightdevice #lighting2params").hide();
				$("#dialog-addmanuallightdevice #lighting3params").hide();
				$("#dialog-addmanuallightdevice #openwebnetparamsIRdetec").show();
			}
			else if (bIsARCType == 1) {
				$('#dialog-addmanuallightdevice #lightparams1 #combohousecode >option').remove();
				$('#dialog-addmanuallightdevice #lightparams1 #combounitcode >option').remove();
				for (ii = 0; ii < tothousecodes; ii++) {
					$('#dialog-addmanuallightdevice #lightparams1 #combohousecode').append($('<option></option>').val(65 + ii).html(String.fromCharCode(65 + ii)));
				}
				for (ii = 1; ii < totunits + 1; ii++) {
					$('#dialog-addmanuallightdevice #lightparams1 #combounitcode').append($('<option></option>').val(ii).html(ii));
				}
				$("#dialog-addmanuallightdevice #lighting1params").show();
				$("#dialog-addmanuallightdevice #lighting2params").hide();
				$("#dialog-addmanuallightdevice #lighting3params").hide();
			}
			else {
				if (lighttype == 103) {
					$("#dialog-addmanuallightdevice #lighting2paramsUnitCode").hide();
				}
				else {
					$("#dialog-addmanuallightdevice #lighting2paramsUnitCode").show();
				}
				$("#dialog-addmanuallightdevice #lighting2params #combocmd2").show();
				if (bIsType5 == 0) {
					$("#dialog-addmanuallightdevice #lighting2params #combocmd1").show();
				}
				else {
					$("#dialog-addmanuallightdevice #lighting2params #combocmd1").hide();
					if ((lighttype == 55) || (lighttype == 57) || (lighttype == 65) || (lighttype == 100)) {
						$("#dialog-addmanuallightdevice #lighting2params #combocmd2").hide();
						if ((lighttype != 65) && (lighttype != 100)) {
							$("#dialog-addmanuallightdevice #lighting2paramsUnitCode").hide();
						}
					}
				}
				$("#dialog-addmanuallightdevice #lighting1params").hide();
				$("#dialog-addmanuallightdevice #lighting2params").show();
				$("#dialog-addmanuallightdevice #lighting3params").hide();
			}
		}

		GetManualLightSettings = function (isTest) {
			var mParams = "";
			var hwdID = $("#dialog-addmanuallightdevice #lighttable #combohardware option:selected").val();
			if (typeof hwdID == 'undefined') {
				ShowNotify($.t('No Hardware Device selected!'), 2500, true);
				return "";
			}
			mParams += "&hwdid=" + hwdID;

			var name = $("#dialog-addmanuallightdevice #devicename");
			if ((name.val() == "") || (!checkLength(name, 2, 100))) {
				if (!isTest) {
					ShowNotify($.t('Invalid Name!'), 2500, true);
					return "";
				}
			}
			mParams += "&name=" + encodeURIComponent(name.val());

			var description = $("#dialog-addmanuallightdevice #devicedescription");
			mParams += "&description=" + encodeURIComponent(description.val());

			mParams += "&switchtype=" + $("#dialog-addmanuallightdevice #lighttable #comboswitchtype option:selected").val();
			var lighttype = $("#dialog-addmanuallightdevice #lighttable #combolighttype option:selected").val();
			mParams += "&lighttype=" + lighttype;
			if (lighttype == 106) {
				//Blyss
				mParams += "&groupcode=" + $("#dialog-addmanuallightdevice #lightparams3 #combogroupcode option:selected").val();
				mParams += "&unitcode=" + $("#dialog-addmanuallightdevice #lightparams3 #combounitcode option:selected").val();
				ID =
					$("#dialog-addmanuallightdevice #lightparams3 #combocmd1 option:selected").text() +
					$("#dialog-addmanuallightdevice #lightparams3 #combocmd2 option:selected").text();
				mParams += "&id=" + ID;
			}
			else if (lighttype == 70) {
				//EnOcean
				//mParams+="&groupcode="+$("#dialog-addmanuallightdevice #lightingparams_enocean #comboid option:selected").val();
				//mParams+="&unitcode="+$("#dialog-addmanuallightdevice #lightingparams_enocean #combounitcode option:selected").val();
				mParams += "&groupcode=" + $("#dialog-addmanuallightdevice #lightingparams_enocean #combounitcode option:selected").val();
				mParams += "&unitcode=" + $("#dialog-addmanuallightdevice #lightingparams_enocean #comboid option:selected").val();
				ID = "EnOcean";
				mParams += "&id=" + ID;
			}
			else if (lighttype == 68) {
				//GPIO
                mParams += "&id=GPIO&unitcode=" + $("#dialog-addmanuallightdevice #lightingparams_gpio #combogpio option:selected").val();
			}
			else if (lighttype == 69) {
				//SysfsGpio
                ID =
                    $("#dialog-addmanuallightdevice #lightparams2 #combocmd1 option:selected").text() +
                    $("#dialog-addmanuallightdevice #lightparams2 #combocmd2 option:selected").text() +
                    $("#dialog-addmanuallightdevice #lightparams2 #combocmd3 option:selected").text() +
                    $("#dialog-addmanuallightdevice #lightparams2 #combocmd4 option:selected").text();
                mParams += "&id=" + ID + "&unitcode=" + $("#dialog-addmanuallightdevice #lightingparams_sysfsgpio #combosysfsgpio option:selected").val();
            }
			else if ((lighttype < 20) || (lighttype == 101)) {
				mParams += "&housecode=" + $("#dialog-addmanuallightdevice #lightparams1 #combohousecode option:selected").val();
				mParams += "&unitcode=" + $("#dialog-addmanuallightdevice #lightparams1 #combounitcode option:selected").val();
			}
			else if (lighttype == 104) {
				mParams += "&unitcode=" + $("#dialog-addmanuallightdevice #he105params #combounitcode option:selected").text();
			}
			else if ((lighttype >= 200) && (lighttype < 300)) {
				//Blinds
				ID =
					$("#dialog-addmanuallightdevice #blindsparams #combocmd1 option:selected").text() +
					$("#dialog-addmanuallightdevice #blindsparams #combocmd2 option:selected").text() +
					$("#dialog-addmanuallightdevice #blindsparams #combocmd3 option:selected").text() +
					"0" + $("#dialog-addmanuallightdevice #blindsparams #combocmd4 option:selected").text();
				mParams += "&id=" + ID;
				mParams += "&unitcode=" + $("#dialog-addmanuallightdevice #blindsparams #combounitcode option:selected").val();
			}
			else if (lighttype == 302) {
				//Home Confort
				ID =
					$("#dialog-addmanuallightdevice #homeconfortparams #combocmd1 option:selected").text() +
					$("#dialog-addmanuallightdevice #homeconfortparams #combocmd2 option:selected").text() +
					$("#dialog-addmanuallightdevice #homeconfortparams #combocmd3 option:selected").text();
				mParams += "&id=" + ID;
				mParams += "&housecode=" + $("#dialog-addmanuallightdevice #homeconfortparams #combohousecode option:selected").val();
				mParams += "&unitcode=" + $("#dialog-addmanuallightdevice #homeconfortparams #combounitcode option:selected").val();
			}
			else if (lighttype == 304) {
				//Fan (Itho)
				ID =
					$("#dialog-addmanuallightdevice #fanparams #combocmd1 option:selected").text() +
					$("#dialog-addmanuallightdevice #fanparams #combocmd2 option:selected").text() +
					$("#dialog-addmanuallightdevice #fanparams #combocmd3 option:selected").text();
				mParams += "&id=" + ID;
			}
			else if ((lighttype == 305)||(lighttype == 306)) {
				//Fan (Lucci Air)
				ID =
					$("#dialog-addmanuallightdevice #fanparams #combocmd1 option:selected").text() +
					$("#dialog-addmanuallightdevice #fanparams #combocmd2 option:selected").text() +
					$("#dialog-addmanuallightdevice #fanparams #combocmd3 option:selected").text();
				mParams += "&id=" + ID;
			}
			else if (lighttype == 400) {
				//OpenWebNet Bus Blinds
				var appID = parseInt($("#dialog-addmanuallightdevice #openwebnetparamsBus #combocmd1 option:selected").val() +
					$("#dialog-addmanuallightdevice #openwebnetparamsBus #combocmd2 option:selected").val());
				var ID = ("0002" + ("0000" + appID.toString(16)).slice(-4)); // WHO_AUTOMATION
				var unitcode = $("#dialog-addmanuallightdevice #openwebnetparamsBus #combocmd3 option:selected").val();//TODO : handle bus id (interface) in hardware
				mParams += "&id=" + ID.toUpperCase() + "&unitcode=" + unitcode;
			}
			else if (lighttype == 401) {
				//OpenWebNet Bus Lights
				var appID = parseInt($("#dialog-addmanuallightdevice #openwebnetparamsBus #combocmd1 option:selected").val() +
					$("#dialog-addmanuallightdevice #openwebnetparamsBus #combocmd2 option:selected").val());
				var ID = ("0001" + ("0000" + appID.toString(16)).slice(-4)); // WHO_LIGHTING
				var unitcode = $("#dialog-addmanuallightdevice #openwebnetparamsBus #combocmd3 option:selected").val();//TODO : handle bus id (interface) in hardware
				mParams += "&id=" + ID.toUpperCase() + "&unitcode=" + unitcode;
			}
			else if (lighttype == 402) {
				//OpenWebNet Bus Auxiliary
				var appID = parseInt($("#dialog-addmanuallightdevice #openwebnetparamsAUX #combocmd1 option:selected").val());
				var ID = ("0009" + ("0000" + appID.toString(16)).slice(-4)); // WHO_AUXILIARY
				var unitcode = "0";
				mParams += "&id=" + ID.toUpperCase() + "&unitcode=" + unitcode;
			}
			else if (lighttype == 403) {
				//OpenWebNet Zigbee Blinds
				var ID = $("#dialog-addmanuallightdevice #openwebnetparamsZigbee #inputcmd1").val();
				if (parseInt(ID) <= 0 || parseInt(ID) >= 0xFFFFFFFF) {
					ShowNotify($.t('Zigbee id is incorrect!'), 2500, true);
					return "";
				}
				var unitcode = $("#dialog-addmanuallightdevice #openwebnetparamsZigbee #combocmd2 option:selected").val();
				mParams += "&id=" + ID + "&unitcode=" + unitcode;
			}
			else if (lighttype == 404) {
				//OpenWebNet Zigbee Light
				var ID = $("#dialog-addmanuallightdevice #openwebnetparamsZigbee #inputcmd1").val();
				if (parseInt(ID) <= 0 || parseInt(ID) >= 0xFFFFFFFF) {
					ShowNotify($.t('Zigbee id is incorrect!'), 2500, true);
					return "";
				}
				var unitcode = $("#dialog-addmanuallightdevice #openwebnetparamsZigbee #combocmd2 option:selected").val();
				mParams += "&id=" + ID + "&unitcode=" + unitcode;
			}
			else if (lighttype == 405) {
				//OpenWebNet Dry Contact
				var appID = parseInt($("#dialog-addmanuallightdevice #openwebnetparamsDryContact #combocmd1 option:selected").val());
				var ID = ("0019" + ("0000" + appID.toString(16)).slice(-4)); // WHO_DRY_CONTACT_IR_DETECTION (25 = 0x19)
				var unitcode = "0";
				mParams += "&id=" + ID.toUpperCase() + "&unitcode=" + unitcode;
			}
			else if (lighttype == 406) {
				//OpenWebNet IR Detection
				var appID = parseInt($("#dialog-addmanuallightdevice #openwebnetparamsIRdetec #combocmd1 option:selected").val() +
					$("#dialog-addmanuallightdevice #openwebnetparamsIRdetec #combocmd2 option:selected").val());
				var ID = ("0019" + ("0000" + appID.toString(16)).slice(-4)); // WHO_DRY_CONTACT_IR_DETECTION (25 = 0x19)
				var unitcode = "0";
				mParams += "&id=" + ID.toUpperCase() + "&unitcode=" + unitcode;
			}
			else {
				//AC
				var ID = "";
				var bIsType5 = 0;
				if (
					(lighttype == 50) ||
					(lighttype == 55) ||
					(lighttype == 57) ||
					(lighttype == 65) ||
					(lighttype == 100) ||
					(lighttype == 102) ||
					(lighttype == 103) ||
					(lighttype == 105) ||
					(lighttype == 107)
				) {
					bIsType5 = 1;
				}
				if (bIsType5 == 0) {
					ID =
						$("#dialog-addmanuallightdevice #lightparams2 #combocmd1 option:selected").text() +
						$("#dialog-addmanuallightdevice #lightparams2 #combocmd2 option:selected").text() +
						$("#dialog-addmanuallightdevice #lightparams2 #combocmd3 option:selected").text() +
						$("#dialog-addmanuallightdevice #lightparams2 #combocmd4 option:selected").text();
				}
				else {
					if ((lighttype != 55) && (lighttype != 57) && (lighttype != 100)) {
						ID =
							$("#dialog-addmanuallightdevice #lightparams2 #combocmd2 option:selected").text() +
							$("#dialog-addmanuallightdevice #lightparams2 #combocmd3 option:selected").text() +
							$("#dialog-addmanuallightdevice #lightparams2 #combocmd4 option:selected").text();
					}
					else {
						ID =
							$("#dialog-addmanuallightdevice #lightparams2 #combocmd3 option:selected").text() +
							$("#dialog-addmanuallightdevice #lightparams2 #combocmd4 option:selected").text();
					}
				}
				if (ID == "") {
					ShowNotify($.t('Invalid Switch ID!'), 2500, true);
					return "";
				}
				mParams += "&id=" + ID;
				mParams += "&unitcode=" + $("#dialog-addmanuallightdevice #lightparams2 #combounitcode option:selected").val();
			}

			var bIsSubDevice = $("#dialog-addmanuallightdevice #howtable #how_2").is(":checked");
			var MainDeviceIdx = "";
			if (bIsSubDevice) {
				var MainDeviceIdx = $("#dialog-addmanuallightdevice #combosubdevice option:selected").val();
				if (typeof MainDeviceIdx == 'undefined') {
					bootbox.alert($.t('No Main Device Selected!'));
					return "";
				}
			}
			if (MainDeviceIdx != "") {
				mParams += "&maindeviceidx=" + MainDeviceIdx;
			}

			return mParams;
		}

		TestManualLight = function () {
			var mParams = GetManualLightSettings(1);
			if (mParams == "") {
				return;
			}
			$.ajax({
				url: "json.htm?type=command&param=testswitch" + mParams,
				async: false,
				dataType: 'json',
				success: function (data) {
					if (typeof data.status != 'undefined') {
						if (data.status != 'OK') {
							ShowNotify($.t("There was an error!<br>Wrong switch parameters?") + ((typeof data.message != 'undefined') ? "<br>" + data.message : ""), 2500, true);
						}
						else {
							ShowNotify($.t("'On' command send!"), 2500);
						}
					}
				}
			});
		}

		EnableDisableSubDevices = function (ElementID, bEnabled) {
			var trow = $(ElementID);
			if (bEnabled == true) {
				trow.show();
			}
			else {
				trow.hide();
			}
		}

		this.$onInit = function(){
			//global var
			$.devIdx = 0;
			$.LastUpdateTime = parseInt(0);

			$.myglobals = {
				TimerTypesStr: [],
				CommandStr: [],
				OccurenceStr: [],
				MonthStr: [],
				WeekdayStr: [],
				SelectedTimerIdx: 0
			};
			$.LightsAndSwitches = [];
			$scope.MakeGlobalConfig();

			$('#timerparamstable #combotype > option').each(function () {
				$.myglobals.TimerTypesStr.push($(this).text());
			});
			$('#timerparamstable #combocommand > option').each(function () {
				$.myglobals.CommandStr.push($(this).text());
			});
			$('#timerparamstable #occurence > option').each(function () {
				$.myglobals.OccurenceStr.push($(this).text());
			});
			$('#timerparamstable #months > option').each(function () {
				$.myglobals.MonthStr.push($(this).text());
			});
			$('#timerparamstable #weekdays > option').each(function () {
				$.myglobals.WeekdayStr.push($(this).text());
			});

			$(window).resize(function () { $scope.ResizeDimSliders(); });

			$("#dialog-addlightdevice").dialog({
				autoOpen: false,
				width: 400,
				height: 290,
				modal: true,
				resizable: false,
				title: $.t("Add Light/Switch Device"),
				buttons: {
					"Add Device": function () {
						var bValid = true;
						bValid = bValid && checkLength($("#dialog-addlightdevice #devicename"), 2, 100);
						var bIsSubDevice = $("#dialog-addlightdevice #how_2").is(":checked");
						var MainDeviceIdx = "";
						if (bIsSubDevice) {
							var MainDeviceIdx = $("#dialog-addlightdevice #combosubdevice option:selected").val();
							if (typeof MainDeviceIdx == 'undefined') {
								bootbox.alert($.t('No Main Device Selected!'));
								return;
							}
						}

						if (bValid) {
							$(this).dialog("close");
							$.ajax({
								url: "json.htm?type=setused&idx=" + $.devIdx + '&name=' + encodeURIComponent($("#dialog-addlightdevice #devicename").val()) + '&switchtype=' + $("#dialog-addlightdevice #comboswitchtype").val() + '&used=true&maindeviceidx=' + MainDeviceIdx,
								async: false,
								dataType: 'json',
								success: function (data) {
									ShowLights();
								}
							});

						}
					},
					Cancel: function () {
						$(this).dialog("close");
					}
				},
				close: function () {
					$(this).dialog("close");
				}
			});
			$("#dialog-addlightdevice #how_1").click(function () {
				EnableDisableSubDevices("#dialog-addlightdevice #subdevice", false);
			});
			$("#dialog-addlightdevice #how_2").click(function () {
				EnableDisableSubDevices("#dialog-addlightdevice #subdevice", true);
			});

			var dialog_addmanuallightdevice_buttons = {};
			dialog_addmanuallightdevice_buttons[$.t("Add Device")] = function () {
				var mParams = GetManualLightSettings(0);
				if (mParams == "") {
					return;
				}
				$.pDialog = $(this);
				$.ajax({
					url: "json.htm?type=command&param=addswitch" + mParams,
					async: false,
					dataType: 'json',
					success: function (data) {
						if (typeof data.status != 'undefined') {
							if (data.status == 'OK') {
								$.pDialog.dialog("close");
								ShowLights();
							}
							else {
								ShowNotify(data.message, 3000, true);
							}
						}
					}
				});
			};
			dialog_addmanuallightdevice_buttons[$.t("Cancel")] = function () {
				$(this).dialog("close");
			};

			$("#dialog-addmanuallightdevice").dialog({
				autoOpen: false,
				width: 440,
				height: 480,
				modal: true,
				resizable: false,
				title: $.t("Add Manual Light/Switch Device"),
				buttons: dialog_addmanuallightdevice_buttons,
				open: function () {
					ConfigureAddManualSettings();
					$("#dialog-addmanuallightdevice #lighttable #comboswitchtype").change(function () {
						var switchtype = $("#dialog-addmanuallightdevice #lighttable #comboswitchtype option:selected").val(),
							subtype = -1;
						if (switchtype == 1) {
							subtype = 10;	// Doorbell -> COCO GDR2
						} else if (switchtype == 18) {
							subtype = 303;	// Selector -> Selector Switch
						}
						if (subtype !== -1) {
							$("#dialog-addmanuallightdevice #lighttable #combolighttype").val(subtype);
						}
						UpdateAddManualDialog();
					});
					$("#dialog-addmanuallightdevice #lighttable #combolighttype").change(function () {
						var subtype = $("#dialog-addmanuallightdevice #lighttable #combolighttype option:selected").val(),
							switchtype = -1;
						if (subtype == 303) {
							switchtype = 18;	// Selector -> Selector Switch
						}
						if (switchtype !== -1) {
							$("#dialog-addmanuallightdevice #lighttable #comboswitchtype").val(switchtype);
						}
						UpdateAddManualDialog();
					});
					UpdateAddManualDialog();
				},
				close: function () {
					$(this).dialog("close");
				}
			});

			$("#dialog-addmanuallightdevice #howtable #how_1").click(function () {
				EnableDisableSubDevices("#dialog-addmanuallightdevice #howtable #subdevice", false);
			});
			$("#dialog-addmanuallightdevice #howtable #how_2").click(function () {
				EnableDisableSubDevices("#dialog-addmanuallightdevice #howtable #subdevice", true);
			});

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
			popup = $("#thermostat3_popup");
			if (typeof popup != 'undefined') {
				popup.hide();
			}
		});
	}]);
});
