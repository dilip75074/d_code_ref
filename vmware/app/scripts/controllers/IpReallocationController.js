/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.controller('IpReallocationController', function($scope, $rootScope, IpReallocationService, $location, $route, $filter, $translate) {
	
	// Get the page context object
	$rootScope.pageContextObject = angular.copy($route.current.data);
    // Translate heading
    var headerKey = $rootScope.pageContextObject.pageTitle;
	$rootScope.pageContextObject.pageTitle = "";
	$translate(headerKey)
        .then(function (translatedValue) {
            $rootScope.pageContextObject.pageTitle = translatedValue;
        });
    console.log("Page Context Object for ip reallocation screen is: ");
    console.log($rootScope.pageContextObject);

    // IP Reallocation Plan Variables
    $scope.showIpReallocationPlan = false;
    $scope.ipReallocationMap = {};

    // IP Reallocation Confirmation Variables
    $scope.confirmIpReallocationJson = [];
    
    $scope.ipReallocationErrorMessage = "";

    // Loading Mask
    $rootScope.ShowFullScreenLoading = false;
    $rootScope.ShowFullScreenLoadingMsg = '';
	
	$scope.publicIpComponents = {};
    $scope.privateIpComponents = [];

    /**
     * Method to fetch the IP Reallocation Plan
     * 
     */
    $scope.fetchIpReallocationPlan = function() {
        $scope.showIpReallocationPlan = false;
        
        // Show Loading Mask
        $rootScope.ShowFullScreenLoading = true;
        $rootScope.ShowFullScreenLoadingMsg = $filter('translate')('ipreallocation.controller.PLEASE_WAIT_LOAD_IP');
        
        console.log("Fetching the IP Reallocation Plan");
        IpReallocationService.fetchIpReallocationPlan(function(data) {

            // Loading Mask
            $rootScope.ShowFullScreenLoading = false;
            $rootScope.ShowFullScreenLoadingMsg = '';

            console.log("Inside success for fetching the IP Reallocation Plan, data: ");
            console.log(data);
            // Show the IP Reallocation View
            $scope.showIpReallocationPlan = true;
            if (data.status == vrmUi.getIpReallocationValue("SUCCESS")) {
                $scope.ipReallocationMap = data.object;

                // We loop through the IP Reallocation Map to generate the Confirm IP Reallocation JSON
                angular.forEach($scope.ipReallocationMap, function(ips, key) {
                    var configuration = {};
                    configuration[vrmUi.getIpReallocationValue("NAME")] = key;
                    configuration[vrmUi.getIpReallocationValue("VALUE")] = ips[0];
                    $scope.confirmIpReallocationJson.push(configuration);
                    if(undefined != ips && null != ips && ips.length > 0)
                    {
                        $scope.publicIpComponents[key] = ips;
                    }
                    else
                    {
                        $scope.privateIpComponents.push(key);
                    }
                });
                console.log("JSON to be submitted to the confirm IP Reallocation: ");
                console.log($scope.confirmIpReallocationJson);
            }
            else
            {
                scope.ipReallocationErrorMessage = $filter('translate')('ipreallocation.controller.FETCH_IP_ERROR_MSG');
            }
        }, function(data) {
            // Loading Mask
            $rootScope.ShowFullScreenLoading = false;
            $rootScope.ShowFullScreenLoadingMsg = '';
        	// Display error message that we have received from the server
            if(data["message"] == null || data["message"] == undefined || data["message"] == "") {
            	$scope.ipReallocationErrorMessage = $filter('translate')('ipreallocation.controller.FETCH_IP_SERVER_ERROR')+data[vrmUi.getIpReallocationValue("CODE")];
            } else {
            	$scope.ipReallocationErrorMessage = data["message"];
            }
            
        });
    };

    /**
     * Method to confirm the IP Reallocation Plan
     * 
     */
    $scope.confirmIpReallocationPlan = function() {
        // Show Loading Mask
        $rootScope.ShowFullScreenLoading = true;
        $rootScope.ShowFullScreenLoadingMsg = $filter('translate')('ipreallocation.controller.PLEASE_WAIT_CONFIRM_IP');

        console.log("Inside the confirm IP Reallocation Plan controller method");

        // Dont wait for response (Redirect to configure-system screen)
        IpReallocationService.confirmIpReallocationService($scope.confirmIpReallocationJson, function(data) {
            if(data.status == vrmUi.getActivityValue("SUCCESS")) { 
        		console.log("Inside success response for the confirm IP Reallocation Plan");
                // Redirect to the configure system HTML
                $location.url(vrmUi.getIpReallocationValue("CONFIGURE_SYSTEM"));
        	} else {
        		$rootScope.ShowFullScreenLoading = false;
            	$scope.ipReallocationErrorMessage = data.message;
        	}
        }, function(data) {
        	$rootScope.ShowFullScreenLoading = false;
        	$scope.ipReallocationErrorMessage = data.message;
        });        
    };
    
    /**
     * Method to cancel the IP Reallocation Plan and go to the network config method
     * 
     */
    $scope.cancelIpReallocationPlan = function() {
    	console.log("Inside the cancel for the IP Reallocation Plan controller method");
    	// Redirect to the network config HTML
        $location.url(vrmUi.getIpReallocationValue("NETWORK_CONFIG"));
    };

    $scope.closeIpReallocationPopup = function() {
        $rootScope.modalInstance.close();
    };

    // Call the method to fetch the IP Reallocation Plan
    $scope.fetchIpReallocationPlan();
});