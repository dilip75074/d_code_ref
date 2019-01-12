'use strict';


/**
 * @ngdoc function
 * @name stpls.model:Config
 * @desc Locale based app configuration
 */
angular.module('stplsConfig', ['ngCookies', 'stplsTranslate'])
	.factory('Config', ['$http', '$q', '$translate', '$cookies', '$window', function($http, $q, $translate, $cookies, $window) {


	var config = false;
	var locale = false;

	var getEnvironment = function(){

		return window.stpls_env;

	};

	var setLocale = function(l){

		if(l !== locale){

			locale = l;

			$cookies.put('stpls_locale', locale);
			$translate.use(locale);
		}


        return l;


	};

	var getLocale = function(){

		if(!locale){
			initLocale();
		}

		return locale;

	};

	var getRegion = function() {
		var region = getLocale().split(/[_-]/).pop().toUpperCase();
		if (!region) {
			region = 'US';
		}
		return region;
	};

	var getRoutes = function(){

		return config.routes;


	};

	var initLocale = function(){

		// if internal locale set
		if($cookies.get('stpls_locale') !== undefined){

			setLocale($cookies.get('stpls_locale'));

		}
		// determine locale by domain & environment type
		else {

			var host = document.location.hostname;
			var guess = 'en_US';
			if((/ca$/).test(host)) {
				guess = (navigator.language || navigator.browserLanguage).replace('-','_');
				guess = (/(en|fr)_CA/).test(guess) ? guess : 'en_CA';
			}
			setLocale(guess);

		}

	};





	var getConfig = function(env, locale){

		var d = $q.defer();

		if(window.stpls_locale !== null){

			d.resolve(window.stpls_locale);

		}
        else {

            d.reject('locale config not provided');

        }

		return d.promise;

	};

	var getLocalizations = function() {
		var l10n = getProperty('localization');
		return l10n[getLocale()] || l10n[getProperty('locale')];
	};

	var getSeo = function() {
		var seo = angular.copy(getProperty('seo'));
		return angular.extend(seo, getLocalizations().seo);
	};

	var getLanguage = function(){
		return getLocale().split(/[_-]/).shift();
	};


	var getProperty = function(key){
		return config[key];
	};

	var init = function(){

		var d = $q.defer();

		if(!config){

			var e = getEnvironment();
			var l = getLocale();

			console.log('Stpls environment: ' + e);
			console.log('Stpls locale: ' + l);

			getConfig(e, l).then(function(c){

				config = c;

        config.environment = e;

        config.locale = l;

				d.resolve(config);

			});

		}
		else {

			d.resolve(config);

		}




		return d.promise;


	};


	var getApi = function() {
	    var api = getProperty('mobileServiceEnvironment');
	    return getProperty('mobileServiceEnvironments')[api];
	};


	return {

		init: init,

		getLocale: getLocale,
		setLocale: setLocale,
		getRegion: getRegion,
		getProperty: getProperty,
		getLocalizations: getLocalizations,
		getLanguage: getLanguage,
		getSeo: getSeo,
		getRoutes: getRoutes,
		getEnvironment: getEnvironment,
		getApi: getApi

	};

}]);
