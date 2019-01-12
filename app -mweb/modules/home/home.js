'use strict';

/**
 * @ngdoc function
 * @name stpls.model:Home
 */
angular.module('stpls').factory('Home', function($http, $q, MobileService, Account, Config) {


	var getDealsBundle = function(){
		var c = Config.getProperty('deals') || {};
		return c[window.stpls_env] || c.default;
	};

	return {
		getDealsBundle: getDealsBundle
	};

});
