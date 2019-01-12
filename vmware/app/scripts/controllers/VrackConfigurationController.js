/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

 noSecvrmUI.controller('VrackConfigurationController', function($scope, $rootScope, $location, $timeout, HttpCommunicationUtil, $filter) {
 	
 	$scope.vrackProgressPercentage = 0;
 	$scope.poll = function(type) { 
 		$rootScope.vrackPollingProgressStatus = $timeout(function() {
            //clearing the message
            $scope.message = '';

            //after 100% Progress redirect user to login screen and cancle the timwout
            if($scope.vrackProgressPercentage == 100){
            	$scope.vrackProgressPercentage = 100;
            	$timeout.cancel($rootScope.vrackPollingProgressStatus);
            	window.location.href = "config.jsp";
            	return false;
            }
           
            //if type is "powering-on-vrack" start polling for that
            if(type = vrmUi.getVrackConfigurationControllerValue("TYPE")){
				//$scope.vrackProgressPercentage += 10;	
				HttpCommunicationUtil.doGet(vrmUi.getValue("vrackProgressAPI"), function(data){
					console.log(JSON.stringify(data));
					if(data.status == vrmUi.getVrackConfigurationControllerValue("SUCCESS")){
						$scope.vrackProgressPercentage = data.object.totalPercent;

						if(data.object.failedComponents != undefined && data.object.failedComponents.length > 0){
							$scope.message = data.object.failedComponents[0].errorMessage;
							//$timeout.cancel($rootScope.vrackPollingProgressStatus);
							return false;
						} 
					} else {
						$scope.message = data.message;
						//$timeout.cancel($rootScope.vrackPollingProgressStatus);
						return false;
					}
				}, function(data){
					$scope.message = data.message;
					//$timeout.cancel($rootScope.vrackPollingProgressStatus);
					return false;
				});
 			}

            $scope.poll(type);
        }, 2000);
    };     
 });