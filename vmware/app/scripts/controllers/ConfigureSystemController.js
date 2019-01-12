/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

 vrmUI.controller('ConfigureSystemController', function($scope, $rootScope, $location, $timeout, HttpCommunicationUtil, $route, $filter, IpReallocationService, $translate) {
 	// Get the page context object
	$rootScope.pageContextObject = angular.copy($route.current.data);
	// Translate heading
 	var headerKey = $rootScope.pageContextObject.pageTitle;
	$rootScope.pageContextObject.pageTitle = "";
	$translate(headerKey)
        .then(function (translatedValue) {
            $rootScope.pageContextObject.pageTitle = translatedValue;
        });
 	
 	$scope.vrackProgressPercentage = 0;
 	$scope.newIPUrl = '';
 	$scope.configureSystemErrorMessage = "";

 	// Loading Mask
    $rootScope.ShowFullScreenLoading = false;
    $rootScope.ShowFullScreenLoadingMsg = '';
    
    $scope.rerunIpReallocationWorkflow = function() {
    	console.log("Rerunning the workflow since the it was failed");
    	
    	// Display loading panel
    	$rootScope.ShowFullScreenLoading = true;
    	$rootScope.ShowFullScreenLoadingMsg = $filter('translate')('configuresystem.controller.RERUN_WORKFLOW');
    	
    	// AJAX request for rerunning the workflow
    	IpReallocationService.rerunIpReallocationService(function(data) {
            
            console.log("Inside success response for the rerun IP Reallocation Plan");
            
            $scope.getIPReallocationProgress();
            
            // Hide the loading panel
            $rootScope.ShowFullScreenLoading = false;
            $rootScope.ShowFullScreenLoadingMsg = '';
            
        }, function() {
            
        });
    };

 	$scope.getRedirectUrl = function(){
 		console.log("Inside getRedirectUrl...");
 		
 		// 1st hit the API and get the new url
 		HttpCommunicationUtil.doGet(vrmUi.getValue("progressNewIpAPI"), function(data) {
 			if(data.status == vrmUi.getConfigureSystemValue("SUCCESS")) {
 				console.log("newIPUrl :: " + data.object);
 				$scope.newIPUrl = data.object;
 			}
 		}, function(data){
 			$scope.configureSystemErrorMessage = $filter('translate')('configuresystem.controller.FETCH_NEW_IP_SERVER_ERROR')+data[vrmUi.getConfigureSystemValue("CODE")];
 		});
 	};
 	
 	$scope.poll = function(type) { 
 		$rootScope.vrackPollingProgressStatus = $timeout(function() {
            //clearing the message
            $scope.message = '';

            //after 100% Progress redirect user to login screen and cancel the timeout
            if($scope.vrackProgressPercentage == 100) {
            	$scope.vrackProgressPercentage = 100;
            	$timeout.cancel($rootScope.vrackPollingProgressStatus);
            	// Start poll to check if the new IP is up or not
				$scope.isNewIpUpPoll();
            	return false;
            }
           
            if(type == vrmUi.getConfigureSystemValue("CONFIGURE_SYSTEM")) {
            	$scope.getIPReallocationProgress();
 			}

            $scope.poll(type);
        }, 10000);
    };
    
    $scope.getIPReallocationProgress = function() {
    	HttpCommunicationUtil.doGet(vrmUi.getValue("ipReallocationAPI"), function(data){
			if(data.status == vrmUi.getConfigureSystemValue("SUCCESS")) {
				$scope.configureSystemErrorMessage = "";
				
				$scope.vrackProgressPercentage = data.object.totalPercent;
				$scope.runningTasks = data.object.runingTasks;
				$scope.failedTasks = data.object.failedTasks;
				$scope.errorMessages = data.object.errorMessages;
				
				if($scope.vrackProgressPercentage == 100 || $scope.failedTasks.length > 0) {
					$timeout.cancel($rootScope.vrackPollingProgressStatus);
				}
			}				
		}, function(data, status) {
			if(status == 500) {
				// This means that the server is still alive and there is some internal error in the server hence show the error on the UI
				$scope.configureSystemErrorMessage = $filter('translate')('configuresystem.controller.FETCHING_PROGRESS_SERVER_ERROR')+data[vrmUi.getConfigureSystemValue("CODE")];
			} else if(status == 503) {
				// Meaning that the service is unavailable .. so we stop polling
				// No response from the server .. hence making a JSONP call with the new IP address
				// First cancel the timeout function (As we will create a new function using the new IP)
				$timeout.cancel($rootScope.vrackPollingProgressStatus);
				
				// Start poll to check if the new IP is up or not
				$scope.isNewIpUpPoll();
				
				return false;
			} else {
				// Continue with the polling to old IP
			}
		});
    };
    
    $scope.isNewIpUpPoll = function() {
    	$rootScope.vrackNewIpUp = $timeout(function() {
    		console.log("Checking if the TC server with the new IP is up or not");
			HttpCommunicationUtil.jsonP($scope.newIPUrl + vrmUi.getValue("checkIsServerUpAPI"));
    		
    		$scope.isNewIpUpPoll();
    	}, 5000);
    };
    
    //start polling
	$scope.poll(vrmUi.getConfigureSystemValue("CONFIGURE_SYSTEM"));
	
	jsonCallback = function(data) {
		// We got a response from the server .. hence redirect to new IP address
		console.log("We got a response from the server, hence now redirect to new IP address");
		console.log(data);
		
		// First kill the polling too
		$timeout.cancel($rootScope.vrackNewIpUp);
		
		// Then redirect to the new IP
		window.location.href = $scope.newIPUrl;
		return false;
	};
 });