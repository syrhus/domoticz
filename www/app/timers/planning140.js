///////////////////////////////////////////////
// Weekly Planning ,  2017, Syrhus
// v1.4.0
// updated for v4.9700
// 2018-09-20 : add  Odd & Even week numbers
// 2018-10-30 : bug on <th> fixed
// 2018-12-11 : Disable/Enable all setPoints (avoid to clear a planning to set it in standby mode)
//							Time precision to 15mins
//							Add i18n translations
//							Highlight on hover
//							Time range selection
// 2018-12-20 : adjust table time range depending on setpoint minutes.
//		listen timers event [timersInitialized] & [timersLoaded]
//              improve speed performance
//		adujst to the right mode if less than 4 modes used and not "heatest"
// 2019-11-18 : clear only previous timers id instead of calling the clearTimers function which erase all timers on all timerplan
///////////////////////////////////////////////

 function PlanningTimerSheet(options){
	$('head').append('<link rel="stylesheet" type="text/css" href="../css/planning.css">');

	var bIsSelecting = false;
	var bAddClass = true;
	var modeSelected = 0;

	var $this = this;

	const MON = 1;
	const TUE = 2;
	const WED = 4;
	const THU = 8;
	const FRI = 16;
	const SAT = 32;
	const SUN = 64;
	const EVERYDAYS = 128;
	const WEEKDAYS = 256;
	const WEEKENDS = 512;

	const SUM_EVERYDAYS = 127;
	const SUM_WEEKDAYS = 31;
	const SUM_WEEKENDS = 96;

	const ODD = 8;
	const EVEN = 9;
	const ONTIME = 2;

	$this.$element = null;
	$this.$table = null;
	$this.$tbody = null;
	$this.$thead = null;

	$this.prevTimers = [];
	$this.planning = [];

	//////////////////////////////

	var days = [
		{ "name": "Monday" },
		{ "name": "Tuesday" },
		{ "name": "Wednesday" },
		{ "name": "Thursday" },
		{ "name": "Friday" },
		{ "name": "Saturday" },
		{ "name": "Sunday" }];

	var planning_translations = [
		{'lng':'en', 'res':{
			'activate all': 'Activate all',
			'deactivate all': 'Deactivate all',
			'Comfort':'Comfort',
			'Economic':'Economic',
			'Nighttime':'Night time',
			'NoFreeze':'Frost free',
			'timeRange': 'Time range',
			'hour':'hour',
			'mins':'mins'
		}},
		{'lng':'fr','res':{
			'activate all': 'Tout activer',
			'deactivate all': 'Tout désactiver',
			'Comfort':'Confort',
			'Economic':'Economique',
			'Nighttime':'Nuit',
			'NoFreeze':'Hors gel',
			'timeRange': 'Plage horaire',
			'hour':'heure',
			'mins':'mins'
		}}
		/* add others translations here
		,{'lng':'XX', 'res':{
				...
		}}
		*/
	];

	$this.defaults = $.extend({
		"devid":null,
		"container":"#deviceTimers",
		"commandClear":"clearsetpointtimers",
		"commandAdd":"addsetpointtimer",
		"buttonClass":"btnstyle3",
		"buttonModeClassSelected": "btnstyle3-sel",
		"odd_even_week" :false,
		"vertical":false,
		"viewThumbnail": false,
		"responsive_max_width":"500px",
		"modes":
		[{ "value": 22, "class": "m0", "name": "Comfort"},
		{ "value": 19, "class": "m1", "name": "Economic"},
		{ "value": 16, "class": "m2", "name": "Nighttime"},
		{ "value": 4, "class": "m3", "name": "NoFreeze"}],
		"temperatureModes":true,
		"hover_activate":true, //to highlight row and column on mouse hover
		"nbTicksPerHour":2, //6 for 10mins, 4 for 15mins, 2 for 30mins, 1 for 1hour
		"propValue":"Temperature",
		"propValueAjax":"tvalue"}, options);
	//////////////////////////////////////////////////

	$this.Clear = function () {
		$this.$tbody.find('td').removeClass();
	};

	//add or remove class to selected cell
	setSel = function (elt) {
		var vclass = getModeClass();
		if (vclass == null)
			return;

		$(elt).removeClass();
		if (bAddClass)
			$(elt).addClass(vclass);
	};

	//apply class to row range
	setRowSel = function ($td) {
		var $found =  findTdRow($td);
		if($found)
			$found.removeClass().addClass(getModeClass());
	};

	findTdRow = function($td){
		if(!$td.attr('rowspan'))
			return $td.siblings('td');
		else {
			// Find span count in first td. Select next rows.
			var spanCount = $td.attr('rowspan');
			return $td.parent().nextAll().addBack().slice(0, spanCount).children('td');
		}
	};

	//apply class to col range
	setColSel = function ($col) {
	  var $found =  findTdCol($col);
		if($found)
			$found.removeClass().addClass(getModeClass());
	};

	findTdCol = function($col){
		if(defaults.vertical)
			return findTdColVertical($col);

		var h = $col.attr("h");
		var m = $col.attr("m");
		var colspan = $col.attr("colspan");
		if(colspan == undefined)
			colspan = 1;
		else colspan = parseInt(colspan);

		var $found = null;
		if (h) {
			var index = parseInt(h);
			$found = $tbody.find("td[h=" + index + "]");
			if(m){
				if(colspan > 1){
					if (m === "0" )
						$found = $found.filter("td[m='0'],td[m='15'],td[m='10'],td[m='20']");
					else
						$found = $found.filter("td[m='30'],td[m='45'],td[m='40'],td[m='50']");
				} else if (colspan === 1) {
					$found = $found.filter("td[m='" + m +"']");
				}
			}
		}
		else
			$found = $tbody.find("td");
		return $found;
	};


	findTdColVertical = function($col){
		var d = $col.attr("index");
		var colspan = 1;

		var $found = null;
		if (d) {
			var index = parseInt(d);
			$found = $tbody.find("td[index=" + index + "]");
		}
		else
			$found = $tbody.find("td");
		return $found;
	};


	getMode = function () {
		if (modeSelected < 0 || modeSelected >= defaults.modes.length)
			return null;
		else return defaults.modes[modeSelected];
	};

	getModeClass = function () {
		var _mode = getMode();
		return (_mode != null ? _mode.class : null);
	};

	getSlice2 = function(val){  return ("0" + val).slice(-2); }

	createPlanning = function ($this, isOddEven) {
		$this.planning = [];
		for (var i = 1; i <= (isOddEven ? 14 : 7); i++)
			$this.planning.push({ "day": i, "triggers": [] });
	};

	$this.getPlanning = function () {
		var plan = [];
		if(!defaults.vertical){
			$this.$tbody.find('tr').each(function (index, row) {
				var day = { "day": index+1 , "triggers" :[]};

				var prev = null;
				var prevDeactivated = null;
				$(row).find("td[class!='']").each(function (ndx, td) {
					var $$this = $(td);
					var deactivated = $$this.hasClass("deactivate");
					var cls = $$this.prop("classList")[0];
					if (cls != prev || prevDeactivated != deactivated) {
						prev = cls;
						prevDeactivated = deactivated;
						day.triggers.push({ "hour": + $$this.attr("h"), "min": + $$this.attr("m"), "value":  getValueFromClass(cls) , "class" : cls, "active": !deactivated });
					}
				});
				plan.push(day);
			});
		} else {
			$this.$thead.find('th[index]').each(function (index, col) {
				var day = { "day": index+1 , "triggers" :[]};

				var prev = null;
				var prevDeactivated = null;
				$this.$tbody.find("td[index=" + (index +1) + "][class!='']" ).each(function (ndx, td) {
					var $$this = $(td);
					var deactivated = $$this.hasClass("deactivate");
					var cls = $$this.prop("classList")[0];
					if (cls != prev || prevDeactivated != deactivated) {
						prev = cls;
						prevDeactivated = deactivated;
						day.triggers.push({ "hour": + $$this.attr("h"), "min": + $$this.attr("m"), "value":  getValueFromClass(cls) , "class" : cls, "active": !deactivated });
					}
				});
				plan.push(day);
			});
		}
		return plan;
	};

	$this.loadPlanning = function (json) {
		if(!$this.$element.is(':visible'))
			return;

		convertSetPointstoTriggers(json, $this);
		if($this.$table && $this.$table.find('tbody tr').length >0 )
			this.Clear();
		else
			initPlanningTable($this);
		showPlanning($this);
	};

	showPlanning = function($this){
		if(!$this.defaults.viewThumbnail){
			setModes($this);
			$.each($this.planning, function (index, day) {
				var $tds = !defaults.vertical ? $this.$tbody.find("tr[index="+ (day.day) + "] td") : $this.$tbody.find("td[index="+ (day.day) + "]");
				var prev = { "hour": -1, "class": "", "min":-1};
				var nbticks = defaults.nbTicksPerHour;
				$.each(day.triggers, function (ndx, hour) {
					if (prev.hour !== -1)
						$tds.slice(getNbTicksToAdd(nbticks, prev), getNbTicksToAdd(nbticks, hour)).addClass(prev.class);
					prev = hour;
					$tds.slice(getNbTicksToAdd(nbticks, hour)).removeClass().addClass(hour.class);
				});
			});
		}
		else {
			var today = new Date().getDay();
			var tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow = tomorrow.getDay();

			$.each($this.planning, function (index, day) {
				if(day.day === today || day.day === tomorrow){

					var $tds = (day.day === today ? $this.$tbody.find("tr:first td") : $this.$tbody.find("tr:last td"));
					var prev = { "hour": -1, "class": "", "min":-1};
					var nbticks = 1;
					$.each(day.triggers, function (ndx, hour) {
						if (prev.hour !== -1)
							$tds.slice(getNbTicksToAdd(nbticks, prev), getNbTicksToAdd(nbticks, hour)).addClass(prev.class);
						prev = hour;
						$tds.slice(getNbTicksToAdd(nbticks, hour)).removeClass().addClass(hour.class);
					});
				}
			});
		}
	};

	getNbTicksToAdd = function(nbticks, obj){
			if(nbticks === 1)
				return obj.hour;
			else {
				var divider = 15;
				switch (nbticks) {
					case 2:
						divider = 30;
						break;
					case 6:
						divider = 10;
						break;
					case 4:
					default:
						divider = 15;
				}
				return obj.hour *nbticks + (obj.min/divider);
			}
	};

	convertTriggersToSetPoints = function (planning) {
		var setPoints = [];
		$.each(planning, function (index, day) {
			$.each(day.triggers, function (ndx, elt) {
				var setPoint = {"Active":(this.active ? "true" : "false"), "Date": "", "MDay": 0, "Month": 0, "Occurence": 0, "Type": 2 };
				setPoint[defaults.propValue] = this.value;
				setPoint.Hour = this.hour;
				setPoint.Time = getSlice2(this.hour) + ":" + getSlice2(this.min) ;//("0" + $this.hour).slice(-2) + ":" + ("0" + $this.min).slice(-2);
				setPoint.Min = this.min;

				if(defaults.odd_even_week)
					setPoint.Type = (day.day > 7 ? EVEN : ODD );
				setPoint.Days = Math.pow(2, day.day - (setPoint.Type === EVEN ? 8 : 1));
				setPoints.push(setPoint);
			});
		});

		//search sames setPoint to another days to mutualize setPoint
		for (var i = 0; i < setPoints.length; i++) {
			var sp = setPoints[i];
			var sameSetPoints = [];
			var newSetPoints = setPoints.filter(function (setpoint, index) {
				if (setpoint.Time === sp.Time
					&& setpoint.Active === sp.Active
					&& setpoint[defaults.propValue] == sp[defaults.propValue]
					&& setpoint.Days != sp.Days
				  && setpoint.Type === sp.Type) {
					sameSetPoints.push(setpoint);
					return false;
				}
				else
					return true;
			})

			if (sameSetPoints.length) {
				for (var j = 0; j < sameSetPoints.length; j++) {
					sp.Days |= sameSetPoints[j].Days;
				}
			}

			setPoints = newSetPoints;
		}
		return setPoints;
	};

	convertSetPointstoTriggers = function (SetPoints, $this) {

		//check if you have to display odd&even week
		var isOddEven = false;
		var nbTicks = 2;
		var bReload = false;
		$.each(SetPoints, function (ndx) {
			var time = parseInt(this.Time.substr(3, 2));
			if(time === 10 || time === 20 || time === 40 || time === 50)
				nbTicks = 6;
			else if(nbTicks <4 && time === 15 || time === 45)
				nbTicks = 4;
			else if(nbTicks < 2 && time === 30)
				nbTicks = 2;

			if (this.Type === EVEN || this.Type === ODD) {
				isOddEven = true;
			}

			if(isOddEven && nbTicks === 6)
				return false;
		});

		if($this.defaults.nbTicksPerHour < nbTicks){
			$this.defaults.nbTicksPerHour = nbTicks;
			bReload = true;
		}

		$this.$element.find('#oew_oddeven').attr('checked', isOddEven);
		if($this.defaults.odd_even_week !== isOddEven){
			$this.defaults.odd_even_week = isOddEven;
			bReload = true;
		}

		createPlanning($this, isOddEven);

		var values = [];
		$this.prevTimers = [];
		$.each(SetPoints, function (ndx) {
			//if ($this.Active && ($this.Type === ONTIME || $this.Type === EVEN || $this.Type === ODD)) {
			if (this.Type === ONTIME || this.Type === EVEN || this.Type === ODD) {
				$this.prevTimers.push(this.idx);

				var trigger = {};
				var day = 1;

				trigger.hour = parseInt(this.Time.substr(0, 2));
				trigger.min = parseInt(this.Time.substr(3, 2));
				trigger.value = this[$this.defaults.propValue];
				trigger.active = (this.Active === 'true');
				if( values.indexOf(trigger.value) === -1)
					values.push(trigger.value);

				var days = [];

				if(this.Type === EVEN){
					if (this.Days === EVERYDAYS)
							days.push(8, 9, 10, 11, 12, 13, 14);
					else if (this.Days === WEEKDAYS)
							days.push(8, 9, 10, 11, 12);
					else if (this.Days === WEEKENDS)
						days.push(13, 14);
					else {
						if (this.Days & MON)
							days.push(8);
						if (this.Days & TUE)
							days.push(9);
						if (this.Days & WED)
							days.push(10);
						if (this.Days & THU)
							days.push(11);
						if (this.Days & FRI)
							days.push(12);
						if (this.Days & SAT)
							days.push(13);
						if (this.Days & SUN)
							days.push(14);
					}
				}
				else{
					if (this.Days === EVERYDAYS)
							days.push(1, 2, 3, 4, 5, 6, 7);
					else if (this.Days === WEEKDAYS)
							days.push(1, 2, 3, 4, 5);
					else if (this.Days === WEEKENDS)
						days.push(6, 7);
					else {
						if (this.Days & MON)
							days.push(1);
						if (this.Days & TUE)
							days.push(2);
						if (this.Days & WED)
							days.push(3);
						if (this.Days & THU)
							days.push(4);
						if (this.Days & FRI)
							days.push(5);
						if (this.Days & SAT)
							days.push(6);
						if (this.Days & SUN)
							days.push(7);
					}
				}
				$.each(days, function (ndx, val) {
					$this.planning[val-1].triggers.push($.extend({},trigger));
				});
			};
		});


		values.sort(function (a, b) {  return b - a;  }); //desc order
		if($this.defaults.temperatureModes){
			var valuescount = values.length;
			var modescount = $this.defaults.modes.length;
			var $modes = $this.$element.find('.modes .mode input');
			if(valuescount< modescount){
				for(var i = 0; i < valuescount ; i++){
					var j = i;
					while(j < modescount){
						if(values[i] >= $this.defaults.modes[j].value || j === (modescount-1)){
							$this.defaults.modes[j].value = values[i];
							break;
						} else if(values[i] < $this.defaults.modes[j].value && values[i] > $this.defaults.modes[j+1].value){
								$this.defaults.modes[j].value = values[i];
								break;
						}
						j++;
					}
				}
			} else {
					for(var i= 0; i < $this.defaults.modes.length; i++){
						$this.defaults.modes[i].value = values[i];
					}
			}

			for(var i= 0; i < $this.defaults.modes.length; i++){
				$modes.filter('[index=' + i + ']').val($this.defaults.modes[i].value);
			}
		}

		$.each($this.planning, function (ndx, day) {
			$.each(day.triggers, function(index, trigger){
				trigger.class = getClassFromValue($this, trigger.value);
				if(!trigger.active)
					trigger.class += " deactivate";
			});

			day.triggers.sort(function (a, b) {
				if (a.hour === b.hour) return 0;
				else return (a.hour < b.hour) ? -1 : 1;
			});
		})
	};

	updateSetPoints = function(active){
		var plan = getPlanning();
		var setPoints = convertTriggersToSetPoints(plan);
    var activeForced = (arguments.length === 1 ? true: false);

		var timers= [];
		$.each(setPoints, function(ndx, tsettings){
			if(tsettings.Days === SUM_EVERYDAYS)
				tsettings.Days = EVERYDAYS;
			else if(tsettings.Days === SUM_WEEKDAYS)
				tsettings.Days = WEEKDAYS;
			else if(tsettings.Days === SUM_WEEKENDS)
				tsettings.Days = WEEKENDS;

			var urlcmd =  "json.htm?type=command&param=" + defaults.commandAdd +"&idx=" + defaults.devid +
				"&active=" + (activeForced ? active : tsettings.Active) +
				"&timertype=" + tsettings.Type +
				"&date=" + tsettings.Date +
				"&hour=" + tsettings.Hour +
				"&min=" + tsettings.Min +
				"&" + defaults.propValueAjax +"=" + tsettings[defaults.propValue] +
				"&days=" + tsettings.Days +
				"&mday=" + tsettings.MDay +
				"&month=" + tsettings.Month +
				"&occurence=" + tsettings.Occurence +
				"&randomness=false";

			if(!defaults.temperatureModes && defaults.propValueAjax !== "command")
				urlcmd += "&command=0";

			timers.push(urlcmd);
		});

		clearPrevSetPoints(addSetPointTimers, timers);

	};

	clearPrevSetPoints = function(callbackFunc, param){
		var timers = [];
		$.each(prevTimers, function(ndx, timerid){
			timers.push("json.htm?type=command&param=delete"+ (defaults.temperatureModes ? "setpoint" : "") + "timer&idx=" + timerid);
		});

		runAjaxLoop(timers,'Problem deleting timer!',0, callbackFunc, param );
	};

	addSetPointTimers = function(param){
		runAjaxLoop(param,'Problem adding timer!',0, defaults.refreshCallback);
	};

	runAjaxLoop = function(loopParams, errorMsg, curIndex, callbackFunc, param){
		if(loopParams.length > 0)
			$.ajax({
				url: loopParams[curIndex],
				dataType: 'json',
				error: function () {
					HideNotify();
					ShowNotify($.t(errorMsg), 2500, true);
				},
				complete: function(){
					curIndex++;
					if(curIndex < loopParams.length)
						runAjaxLoop(loopParams, errorMsg, curIndex, callbackFunc, param);
					else if(callbackFunc)
						callbackFunc(param);
				}
			});
		else if(callbackFunc)
			callbackFunc(param);
	};

	getValueFromClass = function (cls) {
		var res = $.grep(defaults.modes, function (elt, ndx) {
			return elt.class === cls;
		});
		if (res != null && res.length > 0)
			return res[0].value;
		else
			return null;
	};

	getClassFromValue = function ($this, val) {
		var res = $.grep($this.defaults.modes, function (elt, ndx) {
			return elt.value == val;
		});
		if (res != null && res.length > 0)
			return res[0].class;
		else
			return null;
	};

	setModes = function($this){
		var _modes = [];
		$.each($this.defaults.modes, function(index, mode){
			var modename = $.t(mode.name);
			_modes.push( "<div class='mode " + $this.defaults.buttonClass +" " + ((index === modeSelected)?$this.defaults.buttonModeClassSelected:"") +"' index=" + index +"><label title=" + modename + ">" + (!$this.defaults.vertical ? modename : modename.substring(0,5)) + "</label>");
			if($this.defaults.temperatureModes)
				_modes.push("<input index=" + index +" type='text' value=" + mode.value +" class='inputmode " + mode.class + "'/><span>°</span>");
			else
				_modes.push("<input index=" + index +" type='text' value='  ' class='inputmode " + mode.class + " readonly'/>");

			_modes.push("</div>");
		});

		$element.find('.modes').off().empty().append(_modes.join(''));

		/////click event on mode buttons
		$element.find('.modes').on("click", ".mode", function () {
			var $elt = $(this);
			if($this.defaults.buttonModeClassSelected != undefined){
				$elt.siblings().removeClass($this.defaults.buttonModeClassSelected);
				$elt.addClass($this.defaults.buttonModeClassSelected);
			}
			modeSelected = $elt.attr("index");
		}).on("change", ".mode input", function(){
			var $elt = $(this);
			$this.defaults.modes[parseInt($elt.attr('index'))].value = $elt.val();
		});
	};



	getColSpan = function(level){
		if(level === 0)		{
			switch (defaults.nbTicksPerHour) {
				case 1:
					return 1;
				case 2:
					return 2;
				case 6:
					return 6;
				default:
					return 4;
			}
		}
		else if (level === 1){
			switch (defaults.nbTicksPerHour) {
				case 2:
					return 1;
				case 6:
					return 3;
				default:
					return 2;
			}
		}
		else return 1;
	};

	$this.createTable = function(){

		if(defaults.vertical){
			createTableVertical();
			return;
		}

		var headers = [];
		headers.push("<tr><th ");
		if(defaults.nbTicksPerHour > 1)
			headers.push("rowspan="+ (defaults.nbTicksPerHour === 2 ? 2 : 3));
	  headers.push( (defaults.odd_even_week ? " colspan=2" : "") + ">" + $.t("All") + "</th>");

		for (var h = 0; h < 24 ; h++) {
			headers.push("<th h=" + h + " colspan=" + getColSpan(0) +  " title='" + h + ":00 - " + h + ":59" +"'>" + h + "</th>");
		}
		headers.push("</tr>");

		var mins =["0"];
		var mins_desc_fin = ["59"];
		if(defaults.nbTicksPerHour >=2){
			headers.push("<tr>");
			mins = ["0","30"];
			mins_desc_fin = ["29","59"];
			for (var h = 0 ; h < 24; h++) {
				for (var m = 0; m < mins.length; m++) {
					headers.push("<th h=" + h + " m=" + mins[m] + " title='" + h + ":" + getSlice2(mins[m]) + " - " + h + ":" + mins_desc_fin[m] + "' colspan=" + getColSpan(1) +"></th>");
				}
			}
			headers.push("</tr>");

			if(defaults.nbTicksPerHour >=4){
				headers.push("<tr>");
				if(defaults.nbTicksPerHour === 4 ){
					mins = ["0","15","30","45"];
					mins_desc_fin = ["14","29","44","59"];
			  }
				else if (defaults.nbTicksPerHour === 6) {
					mins = ["0","10","20","30","40","50"];
					mins_desc_fin = ["09","19","29","39","49","59"];
				}
				for (var h = 0 ; h < 24; h++) {
					for (var m = 0; m < mins.length; m++) {
						headers.push("<th h=" + h + " m=" + mins[m] + " title='" + h + ":" + getSlice2(mins[m]) + " - " + h + ":" + mins_desc_fin[m] + "' ></th>");
					}
				}
				headers.push("</tr>");
			}
		}

		var tds = [];
		createBodyRows(tds, mins, mins_desc_fin,0);
		if(defaults.odd_even_week)
			createBodyRows(tds, mins, mins_desc_fin,7);

		if(defaults.odd_even_week)
			$this.$table.addClass('odd-even');
  	else
			$this.$table.removeClass('odd-even');

		$this.$thead.empty().append(headers.join(''));
		$this.$tbody.empty().append(tds.join(''));
	};

	createTableVertical = function(){
		var headers = [];
		var mins =["0"];
		var mins_desc_fin = ["59"];
		if(defaults.nbTicksPerHour ===2){
			mins = ["0","30"];
			mins_desc_fin = ["29","59"];
		}	else if(defaults.nbTicksPerHour === 4 ){
					mins = ["0","15","30","45"];
					mins_desc_fin = ["14","29","44","59"];
		} else if (defaults.nbTicksPerHour === 6) {
					mins = ["0","10","20","30","40","50"];
					mins_desc_fin = ["09","19","29","39","49","59"];
		}

		createBodyHeaders(headers);

		var tds = [];


		for (var h = 0; h < 24; h++) {
			tds.push("<tr><th h=" + h + " rowspan=" + getColSpan(0) +  " title='" + h + ":00 - " + h + ":59" +"'>" + h + "</th>");
			for (var m = 0; m < mins.length; m++) {
				if(defaults.nbTicksPerHour >= 4 && (m % (mins.length/2) == 0) )
					tds.push("<th h=" + h + " m=" + mins[m] + " title='" + h + ":" + getSlice2(mins[m]) + " - " + h + ":" + mins_desc_fin[m] + "' rowspan=" + getColSpan(1) +"></th>");
				if(defaults.nbTicksPerHour >1 )
			  	tds.push("<th h=" + h + " m=" + mins[m] + " title='" + h + ":" + getSlice2(mins[m]) + " - " + h + ":" + mins_desc_fin[m] + "'></th>");

				var delta = 0;
				for (var d = 0; d < days.length; d++) {
					tds.push("<td index=" + (d + 1 + delta)+ " h=" + h + " m=" + mins[m] + " title='"+ $.t(days[d].name) +" " + h + ":" + getSlice2(mins[m]) + " - " + h + ":" + mins_desc_fin[m] + "'></td>");
				}
				if(defaults.odd_even_week){
					delta = 7;
					for (var d = 0; d < days.length; d++) {
						tds.push("<td index=" + (d + 1 + delta)+ " h=" + h + " m=" + mins[m] + " title='"+ $.t(days[d].name) +" " + h + ":" + getSlice2(mins[m]) + " - " + h + ":" + mins_desc_fin[m] + "'></td>");
					}
				}
				tds.push("</tr>");
			}
		}


		if(defaults.odd_even_week)
			$table.addClass('odd-even');
		else
			 $table.removeClass('odd-even');

		$thead.empty().append(headers.join(''));
		$tbody.empty().append(tds.join(''));
	};

	createBodyRows = function (tds,mins, mins_desc_fin, delta) {

		for (var d = 0; d < days.length; d++) {
			if(d === 0 &&  defaults.odd_even_week)
				tds.push("<tr index=" + (d + 1 + delta) + "><th rowspan=7>"+ $.t( (delta === 0 ? "Odd Week Numbers": "Even Week Numbers")) +"</th><th>" + $.t(days[d].name) + "</th>");
			else
				tds.push("<tr index=" + (d + 1 + delta) + "><th>" + $.t(days[d].name) + "</th>");

			for (var h = 0; h < 24; h++) {
				for (var m = 0; m < mins.length; m++) {
					tds.push("<td h=" + h + " m=" + mins[m] + " title='"+ $.t(days[d].name) +" " + h + ":" + getSlice2(mins[m]) + " - " + h + ":" + mins_desc_fin[m] + "'></td>");
				}
			}
			tds.push("</tr>");
		}
	};

	createBodyHeaders = function (tds) {

		tds.push("<tr><th ");
		if(defaults.nbTicksPerHour > 1)
			tds.push("colspan="+ (defaults.nbTicksPerHour === 2 ? 2 : 3));
		tds.push( (defaults.odd_even_week ? " rowspan=2" : "") + ">" + $.t("All") + "</th>");

		if(defaults.odd_even_week)
			tds.push("<th  colspan=7>"+ $.t( "Odd Week Numbers" ) +"</th><th colspan=7>" + $.t("Even Week Numbers") + "</th></tr><tr>");


		addTdDays(tds,0);
		if(defaults.odd_even_week)
			addTdDays(tds,7);

		tds.push("</tr>");
	};

	addTdDays = function(tds, delta){
		for (var d = 0; d < days.length; d++) {
			var dayname =  $.t(days[d].name);
			if(defaults.odd_even_week)
				dayname = dayname.substring(0,3);

			tds.push("<th  index=" + (d + 1 + delta) +">" + dayname + "</th>");
		}
	}

	$this.createThumbnail = function(){

		var mins =["0"];
		var mins_desc_fin = ["59"];
		var tds = [];
		var ths = [];

		var m = 0;
		var d = new Date().getDay()-1;

		ths.push("<tr>");
		for (var q = 1; q <= 7; q++) {
			if(q%2 ===0)
				ths.push("<th colspan=2>" + (q/2)*6 + "</th>");
			else
				ths.push("<th colspan=" + (q === 1|| q ===7 ? 5 : 4) + "></th>");
		}
		ths.push("</tr>");

		tds.push("<tr>");
		for (var h = 0; h < 24; h++) {
				tds.push("<td h=" + h + " m=" + mins[m] + " title='"+ $.t(days[d].name) +" " + h + ":" + getSlice2(mins[m]) + " - " + h + ":" + mins_desc_fin[m] + "'></td>");
		}
		tds.push("</tr>");

		var tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		d = tomorrow.getDay()-1;
		tds.push("<tr>");
		for (var h = 0; h < 24; h++) {
				tds.push("<td h=" + h + " m=" + mins[m] + " title='"+ $.t(days[d].name) +" " + h + ":" + getSlice2(mins[m]) + " - " + h + ":" + mins_desc_fin[m] + "'></td>");
		}
		tds.push("</tr>");

		$this.$thead.empty().append(ths.join(''));
		$this.$tbody.empty().append(tds.join(''));
	};


	setVertical = function($this){
		if( window.matchMedia("(max-width: " + $this.defaults.responsive_max_width +")").matches ){
			$this.$element.addClass("vertical");
			$this.defaults.vertical = true;
		}
	};

	$this.initUI = function(){
		$element = $($this.defaults.container).find('#ts-planning');
		if($element.length === 0 )
  	 		$element = $('<div id="ts-planning" class="ts-planning"></div>').appendTo($this.defaults.container);
		else {
			 $element.off();
			 if($tbody)
			 		$tbody.off();
			 if($table)
			 		$table.off();
		}

		if(!($this.defaults.nbTicksPerHour === 1 || $this.defaults.nbTicksPerHour === 2 || $this.defaults.nbTicksPerHour ===4 || $this.defaults.nbTicksPerHour ===6))
				$this.defaults.nbTicksPerHour === 2;

		setVertical($this);

		$this.$element.empty().append('<div class="modes"></div>\
							<div class="timeRangediv"><label for="timeRange">' + $.t('timeRange')+ '</label><select name="timeRange" class="timeRange">\
							<option value="1">1 ' + $.t("hour") + '</option>\
							<option value="2">30 ' + $.t("mins") + '</option>\
							<option value="4">15 ' + $.t("mins") + '</option>\
							<option value="6">10 ' + $.t("mins") + '</option>\
							</select></div>\
							<table class="ts-table" >\
								<thead></thead>\
								<tbody></tbody>\
							</table>\
							<div class="ts-actions">\
								<div class="ts-clearTimeSheet" >'+ $.t('Clear') +'</div>\
								<div class="ts-updateSetPoints" >'+ $.t('Update') +'</div>\
								<input id="oew_oddeven" type="checkbox" '+ ($this.defaults.odd_even_week ?"checked" :"") +' /><label for="oew_oddeven">' + $.t("Odd Week Numbers") + ' & ' + $.t("Even Week Numbers")  + '</label>\
								<div class="ts-DisableSetPoints" >'+ $.t('deactivate all') +'</div>\
								<div class="ts-EnableSetPoints" ">'+ $.t('activate all') +'</div>\
							</div>');
		if($this.defaults.buttonClass != undefined)
			$this.$element.find('.ts-actions>div').addClass($this.defaults.buttonClass);

		$this.$table = $this.$element.find('table');
		$this.$tbody = $this.$table.find('tbody');
		$this.$thead = $this.$table.find('thead');
			//////mouse events on tbody
		$this.$tbody.on("mousedown", "td", function (event) {
			bIsSelecting = true;
			bAddClass = !$(this).hasClass(getModeClass());
			setSel(this);
		});
		$this.$tbody.on("mouseup", "td", function (event) {
			setSel(this);
			bIsSelecting = false;
		});
		$this.$tbody.on("mouseover", "td", function (event) {
			if (bIsSelecting)
				setSel(this);
		});
		$this.$tbody.on("click", "th", function (event) {
			setRowSel($(this));
		});
		$this.$table.on("click", "thead th", function (event) {
			setColSel($(this));
		});

		$this.$element.find('.ts-clearTimeSheet').click(function(){
			Clear();
		});

		$this.$element.find('.ts-updateSetPoints').click(function(){
			updateSetPoints();
		});

		$this.$element.find('.ts-DisableSetPoints').click(function(){
			updateSetPoints('false');
		});

		$this.$element.find('.ts-EnableSetPoints').click(function(){
			updateSetPoints('true');
		});

		$this.$element.find('.timeRange').change(function(){
			$this.defaults.nbTicksPerHour = parseInt($(this).val());
			initPlanningTable($this);
			showPlanning($this);
		});

		$('#oew_oddeven').change(function () {
			defaults.odd_even_week = $(this).is(':checked');
			initPlanningTable();
			showPlanning();
		});

		if(defaults.hover_activate){
			$tbody.on("mouseover", "th" , function(event){
				findTdRow($($this)).addClass("hover");
			});
			$tbody.on("mouseout", "th" , function(event){
				findTdRow($($this)).removeClass("hover");
			});

			$thead.on("mouseover", "th", function (event) {
				findTdCol($($this)).addClass("hover");
			});

			$thead.on("mouseout", "th", function (event) {
				findTdCol($($this)).removeClass("hover");
			});
		}
	};

	$this.initUIThumb = function(){
		$this.$element = $($this.defaults.container).find('.ts-planning');
		if($this.$element.length === 0 )
  	 		$this.$element = $('<div class="ts-planning"></div>').appendTo($this.defaults.container);
		else {
			 $this.$element.off();
			 if($this.$tbody)
			 		$this.$tbody.off();
			 if($this.$table)
			 		$this.$table.off();
		}

		if(!($this.defaults.nbTicksPerHour === 1 || $this.defaults.nbTicksPerHour === 2 || $this.defaults.nbTicksPerHour ===4 || $this.defaults.nbTicksPerHour ===6))
				$this.defaults.nbTicksPerHour === 2;

		setVertical($this);

		$this.$element.empty().append('<table class="ts-table ts-thumbnail" ><thead></thead><tbody></tbody></table>');

		$this.$table = $this.$element.find('table');
		$this.$tbody = $this.$table.find('tbody');
		$this.$thead = $this.$table.find('thead');
	};


	initPlanningTable = function ($this) {

		if(!$this.defaults.viewThumbnail){
			$this.createTable();
			$this.$element.find('.timeRange option[value="'+ $this.defaults.nbTicksPerHour + '"]').prop('selected',true);
		}
		else {
			$this.createThumbnail();
		}

		$this.$element.show();
	};

	$( document ).on( "timersLoaded", function(event, items){
		loadPlanning(items);
	});

	$.each(planning_translations, function(idx, res){
		$.i18n.addResources(res.lng,'translation',res.res);
	});

	if(!$this.defaults.viewThumbnail)
		return $this.initUI();
	else
		return $this.initUIThumb();
};
///////////////////////////////////////////
//
$( document ).on( "timersInitialized", function(event, vm, refreshTimers){
	var options = {"devid":vm.deviceIdx, "refreshCallback":function(){refreshTimers();} };
	 if( !vm.isSetpointTimers && ((vm.isDimmer || vm.isSelector) || !vm.IsLED)){
			 $.extend(options, {"commandAdd":"addtimer", "commandClear":"cleartimers","temperatureModes":false} );
			 if((vm.isDimmer || vm.isSelector))
					 $.extend(options, {
					 "modes": $.map( vm.levelOptions, function(val,i){
							 return {"value":val.value, "class":"m"+i, "name":val.label };}),
					 "propValue":"Level",
					 "propValueAjax":"level"});
			 else
					 $.extend(options, {	"modes": [{"value":0,"name":$.t("On"), "class":"green"},{"value":1,"name":$.t("Off"), "class":"red"}],
							 "propValue":"Cmd",
							 "propValueAjax":"command"});
	 }

	PlanningTimerSheet(options);
});
///////////////////////////////////////////
