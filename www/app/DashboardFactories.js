define(['app'], function (app) {
  app.factory('apiDashboard', function($http, $q){
		var url = 'json.htm?type=devices&';

		return {
			getFavorites : function(bFavorites){
				return $http.get(url + 'filter=all&used=true&favorite=' + bFavorites + '&order=[Order]&plan=' + window.myglobals.LastPlanSelected).then(function(response){
					return response.data;
				});
			},
      getLights : function(){
        return $http.get(url + 'filter=light&used=true&order=[Order]&plan=' + window.myglobals.LastPlanSelected).then(function(response){
          return response.data;
        });
      }
		}
	});
  app.factory('deviceFunctions',function(){
    return {
      IsLigthSwitch : function(d){
  			return (
  				(d.Type.indexOf('Light') == 0) ||
  				(d.Type.indexOf('Blind') == 0) ||
  				(d.Type.indexOf('Curtain') == 0) ||
  				(d.Type.indexOf('Thermostat 2') == 0) ||
  				(d.Type.indexOf('Thermostat 3') == 0) ||
  				(d.Type.indexOf('Chime') == 0) ||
  				(d.Type.indexOf('Color Switch') == 0) ||
  				(d.Type.indexOf('RFY') == 0) ||
  				(d.Type.indexOf('ASA') == 0) ||
  				(d.SubType == "Smartwares Mode") ||
  				(d.SubType == "Relay") ||
  				((typeof d.SubType != 'undefined') && (d.SubType.indexOf('Itho') == 0)) ||
  				((typeof d.SubType != 'undefined') && (d.SubType.indexOf('Lucci') == 0))
  			)
  		},

  		IsTempSensor : function(d){
  			return ((typeof d.Temp != 'undefined') || (typeof d.Humidity != 'undefined') || (typeof d.Chill != 'undefined'));
  		},

      IsWeatherSensor: function(d){
        return ( ( (typeof d.Rain != 'undefined')
        || (typeof d.Visibility != 'undefined')
        || (typeof d.UVI != 'undefined')
        || (typeof d.Radiation != 'undefined')
        || (typeof d.Direction != 'undefined')
        || (typeof d.Barometer != 'undefined') )
        && (d.Favorite != 0)
       );
      },

      IsScene : function(d){
        return ((d.Type.indexOf('Scene') == 0) || (d.Type.indexOf('Group') == 0));
      },

      IsSecurity: function(d){
        return ((d.Type.indexOf('Security') == 0) && (d.Favorite != 0))
      },

      IsUtility : function(d){
        return (
          (typeof d.Counter != 'undefined') ||
          (d.Type == "Current") ||
          (d.Type == "Energy") ||
          (d.Type == "Current/Energy") ||
          (d.Type == "Power") ||
          (d.Type == "Air Quality") ||
          (d.Type == "Lux") ||
          (d.Type == "Weight") ||
          (d.Type == "Usage") ||
          (d.SubType == "Percentage") ||
          ((d.Type == "Thermostat") && (d.SubType == "SetPoint")) ||
          (d.SubType == "kWh") ||
          (d.SubType == "Soil Moisture") ||
          (d.SubType == "Leaf Wetness") ||
          (d.SubType == "Voltage") ||
          (d.SubType == "Distance") ||
          (d.SubType == "Current") ||
          (d.SubType == "Text") ||
          (d.SubType == "Alert") ||
          (d.SubType == "Pressure") ||
          (d.SubType == "A/D") ||
          (d.SubType == "Thermostat Mode") ||
          (d.SubType == "Thermostat Fan Mode") ||
          (d.SubType == "Smartwares") ||
          (d.SubType == "Waterflow") ||
          (d.SubType == "Sound Level") ||
          (d.SubType == "Custom Sensor")
        );
      }
    }
  });
})
