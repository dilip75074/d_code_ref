'use strict';


/**
 * @ngdoc function
 * @name stpls.model:Routes
 * @desc Global app routing
 */
angular.module('stplsRouter').factory('Routes', ['$http', '$q', 'Config', function($http, $q, Config) {

	var routes = false;

	var getRoute = function(name){

		if(routes[name] != undefined){
			return routes[name];
		}
		else {
			return false;
		}


	};

	var isRouteActive = function(name){

		var r = Config.getRoutes()[name];

		if(!r || r.internalActive){
			return true;
		}
		else {
			return false;
		}


	};

	var getExternalLinkForRoute = function(name, params){

		var r = Config.getRoutes()[name];


		var injectParams = function(url){

			var bracesReg =  /{(.*?)}/g;

			var p;
			while(p = bracesReg.exec(url)){

				url = url.replace(p[0], (params || {})[p[1]] || '');

			}

			return url;

		};

		// Get external link if present, from locale config
		if(r.externalURL != undefined){
			return injectParams(r.externalURL);
		}
		// Use global link if present
		else if(routes[name].externalURL != undefined){
			return injectParams(routes[name].externalURL);
		}
		else {
			return false;
		}

	};





	var init = function(){

		var d = $q.defer();

		if(window.stpls_global !== null){

			routes = window.stpls_global.routes;

			d.resolve(routes);

		}
		else {

			d.reject();

		}

	};

	init();

	return {

		init: init,

		getRoute: getRoute,

		isRouteActive: isRouteActive,

		getExternalLinkForRoute:getExternalLinkForRoute

	};

}]);
