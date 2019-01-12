/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.controller('ActivityController', function($scope, $rootScope, $modal, ActivityService, AlertMessaging, NotificationService, $route, $timeout, WorkflowService, $filter) {
	console.log('ActivityController loaded');
    	
	// Get the page context object
	$rootScope.pageContextObject = $route.current.data;
	$rootScope.pageContextObject.pageTitle = $filter('translate')($rootScope.pageContextObject.pageTitle);
	
	$scope.pageNumber = 1;
	
	$scope.filterType = vrmUi.getActivityValue("FILTER_TYPE");
	$scope.position = 1;
	$scope.alarmPageNo = 0;
	$scope.showList = true;
	$scope.filterString = "";
	$scope.stopPolling = false;
	$scope.HideFullScreenLoading = false;
	var polling;
	var isTaskListPollingStarted = false;	
	$scope.isExpanded = [];
	$scope.hideNotificationLoadingMask = false;//Loading for notification
    $scope.hideTaskLoadingMask = false;//Loading for task
	/*
     * Get count details
     */
    var ACTIVITY_TYPE_NOTIFICATIONS="ACTIVITY_TYPE_NOTIFICATIONS";
    var ACTIVITY_TYPE_TASKS="ACTIVITY_TYPE_TASKS";
    var ACTIVITY_TYPE_AUDITS="ACTIVITY_TYPE_AUDITS";
    var NOTIFICATION_URL="NOTIFICATION_URL";
    var BACKDROP_STYLE_STATIC="BACKDROP_STYLE_STATIC";
    var TASK_URL="TASK_URL";
	//var responseCount = 0;
	
	$rootScope.fetchNotificationCount();
	
    $scope.fetchCountDetails = function(activityType, url){
    	
    	ActivityService.fetchCountDetails(url, function(data){
        	
			/*responseCount++;
            if(responseCount == 2){
                // Loading Mask
                $rootScope.ShowFullScreenLoading = false;
                $rootScope.ShowFullScreenLoadingMsg = '';
            }*/
    		if(undefined != data.object){
    			if(activityType == vrmUi.getActivityValue(ACTIVITY_TYPE_NOTIFICATIONS)){
    				$scope.hideNotificationLoadingMask = true;
        			$scope.countObject = data.object;
					console.log(JSON.stringify(data.object));
        			$scope.totalNotificationCount = 0;
					angular.forEach(data.object, function(value, index) {
						$scope.totalNotificationCount += value.count;
					});
				}
    			if(activityType == vrmUi.getActivityValue(ACTIVITY_TYPE_TASKS)){
    				$scope.hideTaskLoadingMask = true;
        			$scope.taskCountObject = data.object;
					console.log(JSON.stringify(data.object));
        			$scope.totalTaskCount = $scope.taskCountObject.recentCount + $scope.taskCountObject.runningCount + $scope.taskCountObject.failedCount + $scope.taskCountObject.resumingCount;
    			}  
    			if(activityType == vrmUi.getActivityValue(ACTIVITY_TYPE_AUDITS)){
    				$scope.auditCountObject = data.object;		
    				//TODO :: handle zero and more than zero values condition in the UI
    				$scope.totalAuditCount = data.object;
    			}
    		}
        }, function(data){
			/*responseCount++;
            if(responseCount == 2){
                // Loading Mask
                $rootScope.ShowFullScreenLoading = false;
                $rootScope.ShowFullScreenLoadingMsg = '';
            }*/
            if(activityType == vrmUi.getActivityValue(ACTIVITY_TYPE_NOTIFICATIONS)){
            	//checking for notifications response
                $scope.hideNotificationLoadingMask = true;
            }
            if(activityType == vrmUi.getActivityValue(ACTIVITY_TYPE_TASKS)){
             	//checking for tasks response
            	$scope.hideTaskLoadingMask = true;
            }
        	AlertMessaging.showAlert($filter('translate')('activity.controller.FETCH_ACTIVITY_SERVER_ERROR')+data.code);
        });
    };
     
    /*
     * Get List
     */
    $scope.fetchList = function(position){
    	//console.log("activityType :: "+ $scope.activityType +" Position :: " + position);	
		//Show Loading Mask
		//if($scope.HideFullScreenLoading == false){
    	if($scope.pageNumber == 1){
			$rootScope.ShowFullScreenLoading = true;
			$rootScope.ShowFullScreenLoadingMsg = $filter('translate')('activity.controller.PLEASE_WAIT_FETCH_LIST');
		}
    	if(position == 0){
    		$scope.position = 0;
    		$scope.list = [];
    	}
    	
		var url = '';
		//var url =	'../../json/event.json'; 	
    	if($scope.filterType == 'CRITICAL'){
			url = vrmUi.getValue("eventActivityAll")+'/'+$scope.filterType+'/'+$scope.pageNumber;
		} else if($scope.filterType == 'ERROR'){
			url = vrmUi.getValue("eventActivityAll")+'/'+$scope.filterType+'/'+$scope.pageNumber;
		} else if($scope.filterType == 'WARNING'){
			url = vrmUi.getValue("eventActivityAll")+'/'+$scope.filterType+'/'+$scope.pageNumber;
		} else if($scope.filterType == 'INFORMATIONAL'){
			url = vrmUi.getValue("eventActivityAll")+'/'+$scope.filterType+'/'+$scope.pageNumber;
		} else if($scope.filterType == 'DEBUG'){
			url = vrmUi.getValue("eventActivityAll")+'/'+$scope.filterType+'/'+$scope.pageNumber;
		} else {
			url = "event/vrack/event/"+$scope.pageNumber;
		}
    	
		ActivityService.fetchList(url , function(data){
			// Loading Mask
            $rootScope.ShowFullScreenLoading = false;
            $rootScope.ShowFullScreenLoadingMsg = '';
    		//console.log("List " + $scope.activityType + " :::");
    		//console.log(data);
        	if(data.status == vrmUi.getActivityValue("SUCCESS")) {
				//$scope.list = "";
        		if(data.object != null) {
        			if(data.object.length > 0){
            			for(var i=0 ; i<data.object.length ; i++){
            				$scope.list.push(data.object[i]);
    						console.log(JSON.stringify(data.object[i]));
            			}
            		} else {
            			$scope.list = data.object;
    					console.log(JSON.stringify(data.object));
    				}
    				if($scope.list.length >= 0){
    				    $scope.HideFullScreenLoading = true;
    					$scope.startPollingForNotification();
    				}
        		}
        	} else {
                if($scope.filterType != 'ALL'){
                    $scope.errorMsg = $filter('translate')('activity.controller.NOT_FOUND_MSG')+$scope.filterType+" "+$scope.activityType+' '+$filter('translate')('activity.controller.FOUND_MSG');
                } else {
                    $scope.errorMsg = $filter('translate')('activity.controller.NOT_FOUND_MSG')+$scope.activityType+' '+$filter('translate')('activity.controller.FOUND_MSG');
                }
                $scope.showList = false;
            }
        },function(data){
			// Loading Mask
            $rootScope.ShowFullScreenLoading = false;
            $rootScope.ShowFullScreenLoadingMsg = '';
			$scope.errorMsg = $filter('translate')('activity.controller.FETCH_ACTIVITY_SERVER_ERROR')+data.code;
        });
    };
	
    $scope.startPollingForNotification = function(){
		/*polling = $timeout(function(){
			$scope.fetchList();
		}, 12000);*/
	};
    
    $scope.fetchTasks = function(showLoadingMask){
    	console.log("inside fetch tasks ::"  + $scope.filterString);
		if(showLoadingMask){
			// Show Loading Mask
	        $rootScope.ShowFullScreenLoading = true;
	        $rootScope.ShowFullScreenLoadingMsg = $filter('translate')('activity.controller.PLEASE_WAIT_FETCH_TASK');
		}
		var url;
		if($scope.filterString != ""){
			url = vrmUi.getValue("coreActivityAPI")+$scope.activityType+'?type='+$scope.filterType+'&searchStr='+$scope.filterString;
		} else {
			url = vrmUi.getValue("coreActivityAPI")+$scope.activityType+'?type='+$scope.filterType;
		}
    	//var url = vrmUi.getValue("coreActivityAPI")+$scope.activityType+'/'+$scope.filterType;
    	//var url = "../../json/tasksList.json";
    	$scope.stopPolling = true;
    	$scope.fetchTasksList(url);
    };
	
    $scope.getParameterByName = function(url, name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(url);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }
    
	$scope.fetchTasksList = function(url, showLoadingMask){
		ActivityService.fetchList(url , function(data){
			// Loading Mask
            //$rootScope.ShowFullScreenLoading = false;
            //$rootScope.ShowFullScreenLoadingMsg = '';
            var length = url.split("/").length;
        	var selectedType = "";
        	
        	selectedType = $scope.getParameterByName(url, "type");
        	
        	/*if($scope.filterString != ""){
            	selectedType = url.split("/")[length-2];
            } else {
            	selectedType = url.split("/")[length-1];
            }*/
            if(selectedType == $scope.filterType){
        		$rootScope.ShowFullScreenLoading = false;
                $rootScope.ShowFullScreenLoadingMsg = '';	
        		if(data.status == vrmUi.getActivityValue("SUCCESS") && undefined != data.object){
        			$scope.list = data.object;
            	} else {
    				$scope.showList = false;
                    if($scope.filterType != 'ALL'){
                        $scope.errorMsg = $filter('translate')('activity.controller.NOT_FOUND_MSG')+$scope.filterType+' '+vrmUi.getActivityValue("ACTIVITY_TYPE_TASKS")+' '+$filter('translate')('activity.controller.FOUND_MSG');
                    } else {
                        $scope.errorMsg = $filter('translate')('activity.controller.NOT_FOUND_MSG')+vrmUi.getActivityValue("ACTIVITY_TYPE_TASKS")+' '+$filter('translate')('activity.controller.FOUND_MSG');
                    }
				}
            	//alert(isTaskListPollingStarted);
            	if(isTaskListPollingStarted == false && null!=$scope.list && $scope.list.length>0){	
            		for(var count = 0 ; count<$scope.list.length ; count++){
        				$scope.isExpanded[count] = false;
        			}
            		isTaskListPollingStarted = true;
            		if($scope.stopPolling == true){
            			$scope.startPollingForTasks();
            		}
            	} else {
            		if(null!=$scope.list && $scope.list.length>0){
            			for(var count = 0 ; count<$scope.list.length ; count++){
        					$scope.isExpanded[count] = false;
        				}	
            		}
            	}
            }
        },function(data){
        	// Loading Mask
            $rootScope.ShowFullScreenLoading = false;
            $rootScope.ShowFullScreenLoadingMsg = '';
            $scope.errorMsg = $filter('translate')('activity.controller.FETCH_TASKS_SERVER_ERROR')+data.code;
        });
	};
	
	$scope.startPollingForTasks = function() {
		if($scope.stopPolling == true){
			polling = $timeout(function(){
				$scope.fetchTasks(false);
				$scope.startPollingForTasks();
			}, 120000);
		}
	};
    
    $scope.fetchListonScroll = function(){
		//$scope.position++;
    	$scope.pageNumber++;
    	$scope.fetchList();
	};
    
	$scope.fetchCriticalAlarmsList = function() {
		/*$scope.filterType = 'CRITICAL';
		$scope.fetchList(0);*/
		$scope.alarmlist = [];
		var url = vrmUi.getValue("recentEventAPI")+'/CRITICAL';
		ActivityService.fetchList(url , function(data){
        	if(data.status == vrmUi.getActivityValue("SUCCESS")) {
        		$scope.alarmlist = data.object;
        	}	
        },function(data){
			
        });
	};
	
	/*
	 * Show popups in activity screen
	 * "type" param defines which type of popup to display
	 */
	$scope.showPopup = function(type){
		$scope.errorMsg = '';
		if(type==vrmUi.getActivityValue(ACTIVITY_TYPE_NOTIFICATIONS)){
			$rootScope.modalInstance = $modal.open({
	            templateUrl: vrmUi.getActivityValue(NOTIFICATION_URL),
                backdrop: vrmUi.getActivityValue(BACKDROP_STYLE_STATIC),
                keyboard: false                
	        });
		}
		if(type==vrmUi.getActivityValue(ACTIVITY_TYPE_TASKS)){
			$rootScope.modalInstance = $modal.open({
	            templateUrl: vrmUi.getActivityValue(TASK_URL),
                backdrop: vrmUi.getActivityValue(BACKDROP_STYLE_STATIC),
                keyboard: false
	        });
		}
		/*if(type=="audits"){
			$rootScope.modalInstance = $modal.open({
	            templateUrl: 'app/views/audit.html',
                backdrop: 'static',
                keyboard: false
	        });
		}*/
	};
	
	/*
	 * Handle popup close event
	 */
	$scope.close = function(){
        $rootScope.modalInstance.close();
        $scope.stopPolling = false;
        $timeout.cancel(polling);
		isTaskListPollingStarted = false;
    };
    
	$scope.rerunWorkflow = function(workflowId) {
		console.log("Action to rerun the workflow ID: "+workflowId);
		
		// Show Loading Mask
        $rootScope.ShowFullScreenLoading = true;
        $rootScope.ShowFullScreenLoadingMsg = $filter('translate')('activity.controller.RERUN_WORKFLOW_MSG')+workflowId;
        
		WorkflowService.rerunWorkflow(workflowId, function(data) {
			// Loading Mask
            $rootScope.ShowFullScreenLoading = false;
            $rootScope.ShowFullScreenLoadingMsg = '';    
            $scope.fetchTasks(true);
        },function(data){
			// Loading Mask
            $rootScope.ShowFullScreenLoading = false;
            $rootScope.ShowFullScreenLoadingMsg = '';
        	AlertMessaging.showAlert($filter('translate')('activity.controller.RERUN_WORKFLOW_SERVER_ERROR')+workflowId+$filter('translate')('activity.controller.CONTACT_ADMIN_ERROR_MSG')+data.code);
        });
	};

    $scope.cancelWorkflow = function(workflowId) {
        console.log("Action cancel the workflow ID: "+workflowId);

        // Show Loading Mask
        $rootScope.ShowFullScreenLoading = true;
        $rootScope.ShowFullScreenLoadingMsg = $filter('translate')('activity.controller.CANCEL_WORKFLOW_MSG')+workflowId;

        WorkflowService.cancelWorkflow(workflowId, function(data) {
            // Loading Mask
            $rootScope.ShowFullScreenLoading = false;
            $rootScope.ShowFullScreenLoadingMsg = '';
            $scope.fetchTasks(true);
        },function(data){
            // Loading Mask
            $rootScope.ShowFullScreenLoading = false;
            $rootScope.ShowFullScreenLoadingMsg = '';
            AlertMessaging.showAlert($filter('translate')('activity.controller.CANCEL_WORKFLOW_SERVER_ERROR')+workflowId+$filter('translate')('activity.controller.CONTACT_ADMIN_ERROR_MSG')+data.code);
        });
    };


    $scope.fetchActivities = function(){
        // Show Loading Mask
        //$rootScope.ShowFullScreenLoading = true;
        //$rootScope.ShowFullScreenLoadingMsg = $filter('translate')('activity.controller.PLEASE_WAIT_FETCH_ACTIVITY');
        $scope.fetchCountDetails(vrmUi.getActivityValue("ACTIVITY_TYPE_NOTIFICATIONS"), vrmUi.getValue("eventActivityNotificationsCountAPI"));
        $scope.fetchCountDetails(vrmUi.getActivityValue("ACTIVITY_TYPE_TASKS"), vrmUi.getValue("coreActivityTasksCountAPI"));
        //$scope.fetchCountDetails('audits');
    };
    
    $scope.onScroll = function() {
    	console.log("in onScroll...");
    };
});