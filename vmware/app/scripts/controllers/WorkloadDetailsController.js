/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/
 
vrmUI.controller('WorkloadDetailsController', function($scope, WorkloadDetailsService, $rootScope, $filter) {
	console.log('Workload Details Controller Loaded');
	
	$scope.showLeftArrow = false;
	$scope.showRightArrow = false;
	
	// Error message variable
	$scope.workloadDetailsErrorMessage = "";
	
	// Loading Mask
	$rootScope.ShowFullScreenLoading = false;
	$rootScope.ShowFullScreenLoadingMsg = '';
	$scope.setRackHeight = 239;
	
	$scope.cancel = function() {
        $rootScope.modalInstance.close();
    };

    $scope.setvCenterHeight = function(racks) {
    	var height = 415;
    	if(undefined != racks && null != racks && racks.length>1)
    	{
    		height = racks.length * ($scope.setRackHeight + 60);
    	}
		return "height:" + height + "px;max-height:"+height+"px;min-height:"+height+"px";
    };
	
	$scope.resetTop = function($index, vcenters) {
		var topPadding = 0;
		if($index != 0) {
			topPadding = 30;
		}
		var top = $index * $scope.setRackHeight + 413+ $index*topPadding;

		var totalWidth = $scope.determineWidth(vcenters);

		return "top: "+top + "px;width: "+totalWidth+"px;min-width:"+911+"px";
	};

	$scope.determineWidth = function(vcenters) {
		var totalWidth = 911;
		if(undefined != vcenters && null != vcenters && vcenters.length>0)
		{
			totalWidth = vcenters.length * 456;
		}
		return totalWidth;
	};

	$scope.fetchAllWorkloadDetails  = function(){
		// TODO: Show loading panel
		$rootScope.ShowFullScreenLoading = true;
		$rootScope.ShowFullScreenLoadingMsg = $filter('translate')('workloaddetails.controller.SHOW_FULLSCREEN_LOADING_MSG');
		
		WorkloadDetailsService.fetchWorkloadDetails(function(data){
			if(undefined != data.object && null != data.object){
				// Hide loading panel
				$rootScope.ShowFullScreenLoading = false;
				$rootScope.ShowFullScreenLoadingMsg = '';
				
				$scope.allWorkloads = data.object;
				//$scope.rackList = data.object.rackList;
				
				if($scope.allWorkloads.length > 0){
					$scope.selectedWorkload = $scope.allWorkloads[0];
					$scope.selectedWorkloadIndex = 0;
				}	
				
				if($scope.allWorkloads.length > 1){
					$scope.showRightArrow = true;
				}
			}
		}, function(data) {
			// Hide loading panel
			$rootScope.ShowFullScreenLoading = false;
			$rootScope.ShowFullScreenLoadingMsg = '';
			// Error callback
			$scope.workloadConfigurationErrorMessage = $filter('translate')('workloaddetails.controller.WORKLOAD_CONFIGURATION_ERROR_MSG')+data["code"];
		});
	};
	
	$scope.showNextWorkload = function(){
		
		$scope.showLeftArrow = true;
		$scope.selectedWorkloadIndex++;
		$scope.selectedWorkload = $scope.allWorkloads[$scope.selectedWorkloadIndex];
			
		if($scope.selectedWorkloadIndex+1 == $scope.allWorkloads.length){
			$scope.showRightArrow = false;
		}	
	};
	
	$scope.showPreviousWorkload = function(){
		$scope.showRightArrow = true;
		
		$scope.showLeftArrow = true;
		$scope.selectedWorkloadIndex--;
		$scope.selectedWorkload = $scope.allWorkloads[$scope.selectedWorkloadIndex];
		
		if($scope.selectedWorkloadIndex == 0){
			$scope.showLeftArrow = false;
		}
	};
	
	$scope.fetchAllWorkloadDetails();
	
	$scope.showvCenterDetails = function(vCenterId) {
		window.open('https://' + vCenterId + ':9443/vsphere-client/', '_blank');
	};
});