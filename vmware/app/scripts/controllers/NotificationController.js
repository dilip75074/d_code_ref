/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/
 
vrmUI.controller('NotificationController', function($scope, $rootScope, NotificationService, $filter) {
	
	$scope.filterType = vrmUi.notificationControllerValue("FILTER_TYPE");
	$scope.position = 0;

	$scope.fetchNextNotificationList = function(){
		//console.log("in fetch new page...");
		$scope.position++;
		$scope.fetchNotification($scope.position);
	};
	
	/*
	 * Handle popup close event
	 */
	$scope.close = function() {
        $rootScope.modalInstance.close();
    };
    
    /*
     * Get notification list
     */
    $scope.fetchNotification = function(position){
    	
    	console.log("Type :: " + $scope.filterType + "   Position :: " + position);
    	
    	if(position == 0){
    		$scope.position = 0;
    		$scope.notificationList = [];
    	}

    	var url = vrmUi.getValue("notificationsAPI")+$scope.filterType+'/30/'+position;
    	//var url = '../../json/notificationList.json';
    		
    	NotificationService.fetchNotification(url , function(data){
        	console.log("Fetch notification List");
    		console.log(data);
        	if(data.status == vrmUi.notificationControllerValue("SUCCESS")) {
        		if($scope.notificationList.length > 0){
        			for(var i=0 ; i<data.object.length ; i++){
        				$scope.notificationList.push(data.object[i]);
        			}
        		} else {
        			$scope.notificationList = data.object;
        		}
        	}
        },function(data){
        	
        });
    };
    
    $scope.fetchNotification($scope.position);
});	