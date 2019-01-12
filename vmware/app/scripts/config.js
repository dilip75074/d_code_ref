/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

var vrmUI = angular.module('vrmUI', ['ngRoute', 'ui.bootstrap', 'igTruncate', 'pascalprecht.translate']);

/**
 * Mapping to the URLs
 */
vrmUI.config(function($routeProvider, $translateProvider) {
    console.log("Starting VRM UI config. Mapping the URLs to the controllers and the templates");

    $routeProvider
            .when('/error', {
                controller: 'ErrorController',
                templateUrl: 'app/views/error.html',
                data : {pageTitle: "config.controller.ERROR"}
            })
            .when('/change-password', {
                controller: 'ChangePasswordController',
                templateUrl: 'app/views/change-password.html',
                data : {pageTitle: "config.controller.CHANGE_PASSWORD"}
            })
            .when('/network-config', {
                controller: 'NetworkConfigController',
                templateUrl: 'app/views/network-config.html',
                data : {pageTitle: "config.controller.NETWORK_CONFIG"}
            })
            .when('/physical-network-setup', {
                controller: 'PhysicalNetworkSetupController',
                templateUrl: 'app/views/physical-network-setup.html',
                data : {pageTitle: "config.controller.PHYSICAL_NETWORK_SETUP"}
            })
            .when('/configure-system', {
                controller: 'ConfigureSystemController',
                templateUrl: 'app/views/configure-system.html',
                data : {pageTitle: "config.controller.CONFIGURING_SYSTEM"}
            })
            .when('/ip-reallocation', {
                controller: 'IpReallocationController',
                templateUrl: 'app/views/ip-reallocation.html',
                data : {pageTitle: "config.controller.IP_REALLOCATION"}
            })
            .otherwise({
            	redirectTo: '/change-password'
            });

    console.log("Completed VRM UI config. Mapping the URLs to the controllers and the templates complete");

    $translateProvider.useStaticFilesLoader({
		  prefix: 'app/locale/',
		  suffix: '.json'
	  });
	  
	$translateProvider.preferredLanguage(vrmUi.getValue("LANGUAGE"));
    
    return vrmUI;
});