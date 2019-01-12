/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.controller('MainController', function($scope,$timeout, $location, $rootScope, AlertMessaging, ActivityService, PrivilegeService, $filter, $timeout) {

	console.log("Inside MainController....");
	
	$rootScope.ShowFullScreenLoading = false;
	$rootScope.ShowFullScreenLoadingMsg = '';
	$rootScope.loggedUserPrivilege = [];
	
	$scope.displaylogoutmenu = 0;
	
	$rootScope.isFetchUserPrivilegeComplete = false;
	
	$rootScope.fetchUserPrivileges = function(){
		PrivilegeService.loggedUserPrivileges(function(data){
			$rootScope.isFetchUserPrivilegeComplete = true;
			if(null!=data.object && data.status=='Success'){
				$rootScope.loggedUserPrivilege = data.object;
			}
			console.log("User Privilege");
			console.log(data);
		},function(data){
			console.log("Error User Privilege");
			console.log(data);
		});
		$scope.waitUntilPrivilegesLoad();
	};
	
	$scope.waitUntilPrivilegesLoad = function(){
		if(!$rootScope.isFetchUserPrivilegeComplete){
			$timeout(function(){
				$scope.waitUntilPrivilegesLoad();
			}, 100);
		}
	};
	

	$rootScope.fetchUserPrivileges();

	$scope.toggleDisplaylogoutmenu = function(e) {
		AlertMessaging.closeAllAlerts();
		e.stopPropagation();
		if ($scope.displaylogoutmenu == 1) {
			$scope.displaylogoutmenu = 0;
		} else {
			$scope.displaylogoutmenu = 1;
		}

		console.log($scope.displaylogoutmenu);
	};

	$rootScope.hideDisplaylogoutmenu = function(e) {
		e.stopPropagation();
		if ($scope.displaylogoutmenu == 1) {
			$scope.displaylogoutmenu = 0;
		}
		
		if(typeof $rootScope.hideAllTooltip==vrmUi.getMainControllerValue("FUNCTION")){
			$rootScope.hideAllTooltip(e);
		}
		if(typeof $rootScope.hidePermissionTooltip==vrmUi.getMainControllerValue("FUNCTION")){
			$rootScope.hidePermissionTooltip(e);
		}
		if(typeof $rootScope.hideSettingTooltip==vrmUi.getMainControllerValue("FUNCTION")){
			$rootScope.hideSettingTooltip(e);
		}
	};

	$scope.loadSelectedPage = function(menuItemUrl) {
		console.log(menuItemUrl);
		AlertMessaging.closeAllAlerts();
		$location.url(menuItemUrl);
	};
	
	$scope.closeAlert = function(index){
    	AlertMessaging.closeAlert(index);
    };
    
    /*
     * Get count details
     */
    $rootScope.fetchCountDetails = function(){
    	$timeout(function(){
    		$rootScope.fetchNotificationCount();
    		$rootScope.fetchCountDetails();
    	}, 120000);
    };
    
    $rootScope.fetchNotificationCount = function(){
    	var url = vrmUi.getValue("fetchCountDetailsAPI");
    	$scope.msgCount = 0;
    		ActivityService.fetchCountDetails(url, function(data){
    			console.log(JSON.stringify(data));
    			if(undefined != data.object){
    	    		angular.forEach(data.object, function(value, index) {
						$scope.msgCount += value.count;
					});
    	    		console.log(data.object);
    	    		console.log("Count:"+$scope.msgCount);
    				/*$scope.countObject = data.object;
    				$scope.msgCount = $scope.countObject.alarmCount + $scope.countObject.errorCount + $scope.countObject.warningCount;*/
    			}
    	    }, function(data){
    	    	AlertMessaging.showAlert(vrmUi.getMainControllerValue("FETCH_ACTIVITY_SERVER_ERROR")+data.code);
    	    });
    };
    
});