'use strict';

/**
 * @ngdoc function
 * @name stpls.model:Help
 */
angular.module('stpls').factory('Help', ['$http', 'Config', function($http, Config) {
	
	
	var deals = false;
	var path = false;
	var deliveryPolicy = 'deliveryPolicy.json';
	var shipToStore = 'shipToStore.json';
	var reqConfig = {cache: true};

	var getHelpContent = function() {



        return $http.get('config/help.json');

	};

	var getShipToStoreCtrlContent = function() {

		var file = getPath() + shipToStore;

		return $http.get(file, reqConfig);

	};

	var getDeliveryPolicyCtrlContent = function() {

		var file = getPath() + deliveryPolicy;

		return $http.get(file, reqConfig);

	};

	var getPath = function() {

		if (!path) {
			path = 'config/' + Config.getRegion() + '/';
		}

		return path;
	};

	return {

		getHelpContent: getHelpContent,
		getShipToStoreCtrlContent: getShipToStoreCtrlContent,
		getDeliveryPolicyCtrlContent: getDeliveryPolicyCtrlContent
	};

}]);
