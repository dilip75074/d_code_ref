/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/
 
vrmUI.controller('ErrorController', function($scope, $rootScope, $location, $route, $filter, $translate) {
	console.log("Error Controller Loaded");
	
	// Get the page context object
	$rootScope.pageContextObject = angular.copy($route.current.data);
	// Translate heading
	var headerKey = $rootScope.pageContextObject.pageTitle;
	$rootScope.pageContextObject.pageTitle = "";
	$translate(headerKey)
        .then(function (translatedValue) {
            $rootScope.pageContextObject.pageTitle = translatedValue;
        });
	console.log("Page Context Object for error screen is: ");
	console.log($rootScope.pageContextObject);
});