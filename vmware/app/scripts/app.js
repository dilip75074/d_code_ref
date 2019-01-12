/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

var vrmUI = angular.module('vrmUI', ['ngRoute', 'angular.directives-chartjs-doughnut', 'ui.bootstrap', 'igTruncate', 'flow', 'angularTreeview', 'angularMoment', 'ui.select2', 'luegg.directives', 'pascalprecht.translate']);
var loadOnlyOnce = true;

/**
 * Mapping to the URLs
 */
vrmUI.config(function($routeProvider, flowFactoryProvider, $translateProvider) {
    console.log("Starting VRM UI config. Mapping the URLs to the controllers and the templates");

    $routeProvider
            .when('/', {
                controller: 'DashboardController',
                templateUrl: 'app/views/dashboard.html',
                data : {pageTitle: "app.controller.DASHBOARD"}
            })
            .when('/error', {
                controller: 'ErrorController',
                templateUrl: 'app/views/error.html',
                data : {pageTitle: "app.controller.ERROR"}
            })
            .when('/dashboard', {
                controller: 'DashboardController',
                templateUrl: 'app/views/dashboard.html',
                data : {pageTitle: "app.controller.DASHBOARD"}
            })
            .when('/upload', {
                /*controller: 'DashboardController',*/
                templateUrl: 'app/views/file-upload.html'/*,
                data : {pageTitle: "Dashboard"}*/
            })
            .when('/user-management', {
                //controller: 'UserManagementController',
                templateUrl: 'app/views/user-management.html',
                data : {pageTitle: "app.controller.USER_MANAGEMENT"}
            })
            .when('/activities', {
            	controller:"ActivityController",
                templateUrl: 'app/views/activities.html',
                data : {pageTitle: "app.controller.ACTIVITIES"}
            })
            .when('/settings', {
            	controller:"SettingController",
                templateUrl: 'app/views/settings.html',
                data : {pageTitle: "app.controller.SETTINGS"}
            })

			.when('/help', {
                controller:"HelpController",
                templateUrl: 'app/views/help.html',
                data : {pageTitle: "app.controller.HELP"}
			})

            .when('/topology', {
            	controller:"CompleteTopologyController",
                templateUrl: 'app/views/network-topology.html',
                data : {pageTitle: "DASHBOARD"}

            });

    console.log("Completed VRM UI config. Mapping the URLs to the controllers and the templates complete");
    
	flowFactoryProvider.defaults = {
		target: '/vrm-ui/api/1.0/vdi/file',
		// permanentErrors: [404, 500, 501],
		maxChunkRetries: 1,
		chunkRetryInterval: 5000,
		simultaneousUploads: 1,	    
		chunkSize:1*1024*1024,
		testChunks: true,
		throttleProgressCallbacks:1,
		method: "octet",
		singleFile:true
	};
	
	flowFactoryProvider.on('catchAll', function (event) {
		console.log('catchAll', arguments);
	});
		
	$translateProvider.useStaticFilesLoader({
		  prefix: 'app/locale/',
		  suffix: '.json'
	  });
	  
	$translateProvider.preferredLanguage(vrmUi.getValue("LANGUAGE"));
    
    return vrmUI;
});

vrmUI.run(function($rootScope) {
	$rootScope.$watch(function () {
		if(loadOnlyOnce==true){
			$rootScope.fetchCountDetails();
			loadOnlyOnce = false;
		}
	});
});
