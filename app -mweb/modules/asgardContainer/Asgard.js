'use strict';

/**
 * @ngdoc function
 * @name stpls.model:Asgard
 */
angular.module('stpls').factory('Asgard', function($http, $q, $angularCacheFactory, MobileService, Config) {
	
	
	var config = false;

    //var viewCache = $angularCacheFactory('asgard.views', {
    //    capacity: 10,
    //    maxAge: 180000, // 5 min
    //    storageMode: 'localStorage',
    //    storagePrefix: 'stpls.'
    //});

	var getView = function(name, params) {

        var d = $q.defer();

        var route = window.stpls_locale.routes[name];

        var cAsgard = Config.getProperty('asgard');

        var viewKey = [name, JSON.stringify(params)].join(',');

        console.log(viewKey);

        // if view is cached
        if(window.asgard_views && window.asgard_views[viewKey]){

            d.resolve(window.asgard_views[viewKey]);

        }
        else {

            var aRouteURL = route.asgardURL;


            var bracesReg =  /{(.*?)}/g;

            var p;
            while(p = bracesReg.exec(aRouteURL)){

                var pVal = params[p[1]];

                if(pVal != undefined){

                    aRouteURL = aRouteURL.replace(p[0], pVal);

                }
                else {

                    aRouteURL = aRouteURL.replace(p[0], '');
                }



            }

            aRouteURL = cAsgard.environments[cAsgard.activeEnvironment] + aRouteURL;

            $http.get(aRouteURL, {
                cache: false
            }).then(function(resp){

                d.resolve(resp.data);


            });


        }


        return d.promise;

	};



	return {
		
		getView: getView
	};

});
