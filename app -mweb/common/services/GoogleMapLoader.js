'use strict';

/**
 * @ngdoc function
 * @name stpls.factory:GoogleMapLoader
 */
angular.module('stpls').factory('GoogleMapLoader', ['$http', '$timeout', '$timeout', '$ocLazyLoad', 'Config',
    function($http, $timeout, $window, $ocLazyLoad, Config) {

    var googleAPILoaded = null;
    var googleHelperLoaded = null;
    var callbacks = [];

    var loadGMapHelper = function() {
        if (googleHelperLoaded == null) {

            $ocLazyLoad.load('google-maps').then(function() {
                googleHelperLoaded = true;
                console.log('Angular-Google-Maps loaded');
                if (callbacks.length) {
                    for (var i = 0; i < callbacks.length; i++) {
                        (callbacks[i] || angular.noop)();
                    }
                    callbacks = [];
                }
            });
        }
    };

    var loadGoogleAPI = function() {

        if (googleAPILoaded == null) {
            var client = (Config.getProperty('google') || {}).client || '';
            googleAPILoaded = false;
            var s = document.createElement('script'); // use global document since Angular's $document is weak
            s.src = 'https://maps.googleapis.com/maps/api/js?client=' + client + '&v=3.exp&libraries=places&callback=callbackGoogleAPI';
            document.body.appendChild(s);
            console.log('Google API loading');
        }
    };

    var loadGoogleMap = function(callback) {

        window.callbackGoogleAPI = function() {
            console.log('Google API callback');
            googleAPILoaded = true;
            loadGMapHelper();
        };

        // Already loaded
        if (googleAPILoaded && googleHelperLoaded) {
            (callback || angular.noop)();
            return;
        }

        callbacks.push(callback);
        if (googleAPILoaded && !googleHelperLoaded) {   // Google loaded, helper not
            loadGMapHelper();
        } else {  // nothing loaded yet
           loadGoogleAPI();
        }
    };

    return {
        loadGoogleMap: loadGoogleMap
    };

}]);
