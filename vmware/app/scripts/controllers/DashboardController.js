/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.controller('DashboardController', function($scope, $rootScope, $modal, $route, DashboardService, AlertMessaging, $filter, $timeout, $translate) {
    console.log("Dashboard Controller Loaded");
    
    // Get the page context object
	$rootScope.pageContextObject = angular.copy($route.current.data);
	// Translate heading
	var headerKey = $rootScope.pageContextObject.pageTitle;
	$rootScope.pageContextObject.pageTitle = "";
	$translate(headerKey)
        .then(function (translatedValue) {
            $rootScope.pageContextObject.pageTitle = translatedValue;
        });
    console.log("Page Context Object for change password screen is: ");
    console.log($rootScope.pageContextObject);

    $scope.cpuStatsData = [], $scope.memoryStatsData = [], $scope.storageStatsData = [], $scope.ipStatsData = [];
    $scope.dashboardInfo = {};
    $scope.totalWorkloadStorage = 0;

    $scope.loadVrackInfo = false;
    $scope.displayBlock = vrmUi.getDashboardValue("DISPLAY_STYLE_NONE");
    $scope.loadCPUInfo = false;
    $scope.displayCPUBlock = vrmUi.getDashboardValue("DISPLAY_STYLE_NONE");
    $scope.loadStorageInfo = false;
    $scope.displayStorageBlock = vrmUi.getDashboardValue("DISPLAY_STYLE_NONE");
    $scope.loadMemoryInfo = false;
    $scope.displayMemoryBlock = vrmUi.getDashboardValue("DISPLAY_STYLE_NONE");
	$rootScope.isSDNPresent = false;
	var donutPolling;

	/**
     * Method to show errors for all donuts
     * 
     */
    $scope.showLoadingForAllDonuts = function() {
    	$scope.showCpuStatsGraphMessage = true;
		$scope.cpuStatsGraphMessage = $filter('translate')('dashboard.controller.PLEASE_WAIT_MSG');
		
		$scope.showMemoryStatsGraphMessage = true;
		$scope.memoryStatsGraphMessage = $filter('translate')('dashboard.controller.PLEASE_WAIT_MSG');
		
		$scope.showStorageStatsGraphMessage = true;
		$scope.storageStatsGraphMessage = $filter('translate')('dashboard.controller.PLEASE_WAIT_MSG');
    };
    
    // First show loading text
	$scope.showLoadingForAllDonuts();
	
	/**
	 * Start the polling for donuts
	 * 
	 */
	$rootScope.startPollingForDonuts = function() {
	    donutPolling = $timeout(function(){
			if($scope.activeTab==1)
			{				  
				console.log("fetching");
				$scope.buildDonutsForDashboard();
				$rootScope.startPollingForDonuts();
			}

			else
			{
				$scope.$broadcast(vrmUi.getDashboardValue("TIMER_STOP"));
			}
		}, 120000);
	};
	
    // Basic Rack information
    DashboardService.buildDashboardForRackInfo(function(data) {
    	if(data.status == vrmUi.getDashboardValue("SUCCESS")) {
    		console.log("Successfully fetched the dashbaord information: ");
        	console.log(data);
        	$scope.dashboardInfo = data.object;
        	
        	$scope.getTotalWorkloadStorage();
			
			if(data.object.vrackType==vrmUi.getDashboardValue("VRACK_TYPE_SDN"))
			$rootScope.isSDNPresent = true;
			else
			$rootScope.isSDNPresent = false;
			
        	$scope.loadVrackInfo = true;
        	$scope.displayBlock = vrmUi.getDashboardValue("DISPLAY_STYLE_BLOCK");

    	}
    }, function(data) {

        // TODO: Display error on the UI
    	$scope.loadVrackInfo = false;
    	$scope.displayBlock = vrmUi.getDashboardValue("DISPLAY_STYLE_NONE");
    	AlertMessaging.showAlert($filter('translate')('dashboard.controller.BUILD_VRACK_INFO_SERVER_ERROR')+data.code);
    }, function(data) {
    	$scope.loadVrackInfo = true;
    	$scope.displayBlock = vrmUi.getDashboardValue("DISPLAY_STYLE_BLOCK");
    });
    
    // Resoures (4 graphs) information
    $scope.buildDonutsForDashboard = function() {
    	DashboardService.buildResourcesForDashboard(function(data) {
	    	if(data.status == vrmUi.getDashboardValue("SUCCESS")) {
	    		
	    		// Hide all errors
	    		$scope.hideErrorForAllDonuts();
	    		
	    		$scope.showGraph = true;
				
				// CPU Stats
				if(data.object.cpu != undefined && data.object.cpu != null) {
					console.log("Inside success for CPU stats");				
					
					$scope.loadCPUInfo = true;
	    			$scope.displayCPUBlock = vrmUi.getDashboardValue("DISPLAY_STYLE_BLOCK");
	    			
	    			$scope.usedCPU = data.object.cpu.used.toFixed(2);
					$scope.allocatedCPU = data.object.cpu.allocated.toFixed(2);
					$scope.availableCPU = data.object.cpu.available.toFixed(2);
					$scope.usedInnerCPUPercentage = 0;
					
					if(data.object.cpu.available == 0.0) {
	    				// Show a message on the UI telling the user that data is not present.
						$scope.showCpuStatsGraphMessage = true;
						$scope.cpuStatsGraphMessage = $filter('translate')('dashboard.controller.NO_CPU_STATS_MSG');
	    			} 
	    			else {
	    				if(data.object.cpu.allocated > data.object.cpu.available){
	    					data.object.cpu.allocated = data.object.cpu.available;
	    				}
	    				
	    				$scope.showCpuStatsGraphMessage = false;
						
	    				$scope.usedCPUPercentage = data.object.cpu.used;
	    				$scope.allocatedCPUPercentage = data.object.cpu.allocated - data.object.cpu.used;
	    				if($scope.allocatedCPUPercentage < 0) {
	    					$scope.allocatedCPUPercentage = 0;
	    				}
	    				if(data.object.cpu.used > data.object.cpu.allocated) {
	    					$scope.availableCPUPercentage = data.object.cpu.available - data.object.cpu.used;
	    				} else {
	    					$scope.availableCPUPercentage = data.object.cpu.available - data.object.cpu.allocated;
	    				}
						console.log("Used %: "+$scope.usedCPUPercentage+", Allocated %: "+$scope.allocatedCPUPercentage+", Available %: "+$scope.availableCPUPercentage);
						$scope.usedInnerCPUPercentage = (data.object.cpu.used / data.object.cpu.available) * 100;
						
						if($scope.usedInnerCPUPercentage > 0 && $scope.usedInnerCPUPercentage < 1){
							$scope.usedInnerCPUPercentage = 1;	
						}
						
						var availableCPUColor = vrmUi.getDashboardValue("WHITE_COLOR"); 
						
						if(data.object.cpu.allocated == 0 && data.object.cpu.used == 0){
							availableCPUColor = vrmUi.getDashboardValue("LIGHT_GREY_COLOR");
		    			}
						
						$scope.cpuStatsData = [];
						
						$scope.cpuStatsData.push({"value": $scope.usedCPUPercentage, "color": vrmUi.getDashboardValue("CPU_COLOR")});
						$scope.cpuStatsData.push({"value": $scope.allocatedCPUPercentage, "color": vrmUi.getDashboardValue("GREY_COLOR")});
						$scope.cpuStatsData.push({"value": $scope.availableCPUPercentage, "color": availableCPUColor});
					}
				} else {
					$scope.loadCPUInfo = true;
	                $scope.displayCPUBlock = vrmUi.getDashboardValue("DISPLAY_STYLE_BLOCK");
					$scope.showCpuStatsGraphMessage = true;
					$scope.cpuStatsGraphMessage = $filter('translate')('dashboard.controller.NO_CPU_STATS_MSG');
				}
				
				// Memory Stats
				if(data.object.memory != undefined && data.object.memory != null) {
					console.log("Inside success for Memory stats");
					
					$scope.loadMemoryInfo = true;
	    			$scope.displayMemoryBlock = vrmUi.getDashboardValue("DISPLAY_STYLE_BLOCK");
	    			
	    			$scope.usedMemory = data.object.memory.used.toFixed(2);
					$scope.allocatedMemory = data.object.memory.allocated.toFixed(2);
					$scope.availableMemory = data.object.memory.available.toFixed(2);
					$scope.usedInnerMemoryPercentage = 0;
					
	    			if(data.object.memory.available == 0.0){
	    				// Show a message on the UI telling the user that data is not present.
						$scope.showMemoryStatsGraphMessage = true;
						$scope.memoryStatsGraphMessage = $filter('translate')('dashboard.controller.NO_MEMORY_STATS_MSG');
	    			}
	    			else {
	    				if(data.object.memory.allocated > data.object.memory.available){
	    					data.object.memory.allocated = data.object.memory.available;
	    				}
	    				
	    				$scope.showMemoryStatsGraphMessage = false;
	    				
						$scope.usedMemoryPercentage = data.object.memory.used;
	    				$scope.allocatedMemoryPercentage = data.object.memory.allocated - data.object.memory.used;
	    				if($scope.allocatedMemoryPercentage < 0) {
	    					$scope.allocatedMemoryPercentage = 0;
	    				}
	    				if(data.object.memory.used > data.object.memory.allocated) {
	    					$scope.availableMemoryPercentage = data.object.memory.available - data.object.memory.used;
	    				} else {
	    					$scope.availableMemoryPercentage = data.object.memory.available - data.object.memory.allocated;
	    				}
						console.log("Used %: "+$scope.usedMemoryPercentage+", Allocated %: "+$scope.allocatedMemoryPercentage+", Available %: "+$scope.availableMemoryPercentage);
						$scope.usedInnerMemoryPercentage = (data.object.memory.used / data.object.memory.available) * 100;
						
						if($scope.usedInnerMemoryPercentage > 0 && $scope.usedInnerMemoryPercentage < 1){
							$scope.usedInnerMemoryPercentage = 1;	
						}
						
						var availableMemoryColor = vrmUi.getDashboardValue("WHITE_COLOR"); 
						
						if(data.object.memory.allocated == 0 && data.object.memory.used == 0){
							availableMemoryColor = vrmUi.getDashboardValue("LIGHT_GREY_COLOR");
		    			}
						
						$scope.memoryStatsData = [];
						
						$scope.memoryStatsData.push({"value": $scope.usedMemoryPercentage, "color": vrmUi.getDashboardValue("MEMORY_COLOR")});
						$scope.memoryStatsData.push({"value": $scope.allocatedMemoryPercentage, "color": vrmUi.getDashboardValue("GREY_COLOR")});
						$scope.memoryStatsData.push({"value": $scope.availableMemoryPercentage, "color": availableMemoryColor});
					}
				} else {
					$scope.loadMemoryInfo = true;
	    			$scope.displayMemoryBlock = vrmUi.getDashboardValue("DISPLAY_STYLE_BLOCK");
					$scope.showMemoryStatsGraphMessage = true;
					$scope.memoryStatsGraphMessage = $filter('translate')('dashboard.controller.NO_MEMORY_STATS_MSG');
				}
				
				// Storage Stats
				if(data.object.storage != undefined && data.object.storage != null) {
					console.log("Inside success for Storage stats");
	
					$scope.loadStorageInfo = true;
	    			$scope.displayStorageBlock = vrmUi.getDashboardValue("DISPLAY_STYLE_BLOCK");
	    			
	    			$scope.usedStorage = data.object.storage.used.toFixed(2);
					$scope.allocatedStorage = data.object.storage.allocated.toFixed(2);
					$scope.availableStorage = data.object.storage.available.toFixed(2);
					$scope.usedInnerStoragePercentage = 0;
					
	    			if(data.object.storage.available == 0.0){
	    				$scope.showStorageStatsGraphMessage = true;
						$scope.storageStatsGraphMessage = $filter('translate')('dashboard.controller.NO_STORAGE_STATS_MSG');
	    			}
	    			else {
	    				if(data.object.storage.allocated > data.object.storage.available){
	    					data.object.storage.allocated = data.object.storage.available;
	    				}
	    				
	    				$scope.showStorageStatsGraphMessage = false;
						
						$scope.usedStoragePercentage = data.object.storage.used;
	    				$scope.allocatedStoragePercentage = data.object.storage.allocated - data.object.storage.used;
	    				if($scope.allocatedStoragePercentage < 0) {
	    					$scope.allocatedStoragePercentage = 0;
	    				}
	    				if(data.object.storage.used > data.object.storage.allocated) {
	    					$scope.availableStoragePercentage = data.object.storage.available - data.object.storage.used;
	    				} else {
	    					$scope.availableStoragePercentage = data.object.storage.available - data.object.storage.allocated;
	    				}
						console.log("Used %: "+$scope.usedStoragePercentage+", Allocated %: "+$scope.allocatedStoragePercentage+", Available %: "+$scope.availableStoragePercentage);
						$scope.usedInnerStoragePercentage = (data.object.storage.used / data.object.storage.available) * 100;
						
						if($scope.usedInnerStoragePercentage > 0 && $scope.usedInnerStoragePercentage < 1){
							$scope.usedInnerStoragePercentage = 1;	
						}
						
						var availableStorageColor = vrmUi.getDashboardValue("WHITE_COLOR"); 
						
						if(data.object.storage.allocated == 0 && data.object.storage.used == 0){
							availableStorageColor = vrmUi.getDashboardValue("LIGHT_GREY_COLOR");
		    			}
						
						$scope.storageStatsData = [];
						
						$scope.storageStatsData.push({"value": $scope.usedStoragePercentage, "color": vrmUi.getDashboardValue("STORAGE_COLOR")});
						$scope.storageStatsData.push({"value": $scope.allocatedStoragePercentage, "color": vrmUi.getDashboardValue("GREY_COLOR")});
						$scope.storageStatsData.push({"value": $scope.availableStoragePercentage, "color": availableStorageColor});
					}
				} else {
					$scope.loadStorageInfo = true;
	    			$scope.displayStorageBlock = vrmUi.getDashboardValue("DISPLAY_STYLE_BLOCK");
					$scope.showStorageStatsGraphMessage = true;
					$scope.storageStatsGraphMessage = $filter('translate')('dashboard.controller.NO_STORAGE_STATS_MSG');
				}
	        }
	
	    }, function(data) {
	    	$scope.showGraph = false;
	    	// Show errors for all the donuts
	    	$scope.showErrorForAllDonuts(data);
	    	AlertMessaging.showAlert($filter('translate')('dashboard.controller.STATS_FETCH_SERVER_ERROR') + data.code);
	    }, function(data) {
	    	$scope.showGraph = false;
	    	// Show errors for all the donuts
	    	$scope.showErrorForAllDonuts(data);
    		$scope.loadCPUInfo = true;
            $scope.displayCPUBlock = vrmUi.getDashboardValue("DISPLAY_STYLE_BLOCK");
			$scope.loadMemoryInfo = true;
			$scope.displayMemoryBlock = vrmUi.getDashboardValue("DISPLAY_STYLE_BLOCK");
			$scope.loadStorageInfo = true;
			$scope.displayStorageBlock = vrmUi.getDashboardValue("DISPLAY_STYLE_BLOCK");
	    });
    };
    
    // Build the donuts
	$scope.buildDonutsForDashboard();
	
	// Start the polling for donuts
	$rootScope.startPollingForDonuts();

    /**
     * Method to show errors for all donuts
     * 
     */
    $scope.showErrorForAllDonuts = function(data) {
    	$scope.loadCPUInfo = true;
    	$scope.loadMemoryInfo = true;
    	$scope.loadStorageInfo = true;
    	$scope.displayCPUBlock = vrmUi.getDashboardValue("DISPLAY_STYLE_BLOCK");
    	$scope.displayMemoryBlock = vrmUi.getDashboardValue("DISPLAY_STYLE_BLOCK");
    	$scope.displayStorageBlock = vrmUi.getDashboardValue("DISPLAY_STYLE_BLOCK");
			
    	$scope.showCpuStatsGraphMessage = true;
		$scope.cpuStatsGraphMessage = $filter('translate')('dashboard.controller.FETCH_CPU_STATS_ERROR_MSG') + data[vrmUi.getDashboardValue("KEY_CODE")];
		
		$scope.showMemoryStatsGraphMessage = true;
		$scope.memoryStatsGraphMessage = $filter('translate')('dashboard.controller.FETCH_MEMORY_STATS_ERROR_MSG') + data[vrmUi.getDashboardValue("KEY_CODE")];
		
		$scope.showStorageStatsGraphMessage = true;
		$scope.storageStatsGraphMessage = $filter('translate')('dashboard.controller.FETCH_STORAGE_STATS_ERROR_MSG') + data[vrmUi.getDashboardValue("KEY_CODE")];
    };
    
    /**
     * Method to show errors for all donuts
     * 
     */
    $scope.hideErrorForAllDonuts = function() {
    	$scope.showCpuStatsGraphMessage = false;
		$scope.cpuStatsGraphMessage = "";
		
		$scope.showMemoryStatsGraphMessage = false;
		$scope.memoryStatsGraphMessage = "";
		
		$scope.showStorageStatsGraphMessage = false;
		$scope.storageStatsGraphMessage = "";
    };
    
    $scope.showLogicalResourcesPool = function() {
        $rootScope.modalInstance = $modal.open({
            templateUrl: vrmUi.getDashboardValue("LOGICAL_RESOURCES_URL"),
            backdrop: vrmUi.getDashboardValue("BACKDROP_STYLE_STATIC"),
            keyboard: false
        });
    };

    $scope.showPhysicalResourcesPool = function() {
        $rootScope.modalInstance = $modal.open({
            templateUrl: vrmUi.getDashboardValue("PHYSICAL_RESOURCES_URL"),
            backdrop: vrmUi.getDashboardValue("BACKDROP_STYLE_STATIC"),
            keyboard: false
        });
    };
    
    $scope.showWorkloadConfiguration = function() {
        $rootScope.modalInstance = $modal.open({
            templateUrl: vrmUi.getDashboardValue("SELECT_CONFIG_URL"),
            backdrop: vrmUi.getDashboardValue("BACKDROP_STYLE_STATIC"),
            keyboard: false
        });
    };
    
    $scope.getTotalWorkloadStorage = function() {
    	$scope.totalWorkloadStorage = 0;
    	if($scope.dashboardInfo.workloads == null || $scope.dashboardInfo.workloads == undefined) {
    		console.log("Workloads not found or some error in backend");
    	} else {
    		var workloads = $scope.dashboardInfo.workloads;
    		for(var c = 0 ; c < workloads.length ; c++) {
    			$scope.totalWorkloadStorage += workloads[c][vrmUi.getDashboardValue("KEY_STORAGE")];
    		}
    	}
    };
    
    $scope.showWorkloadList = function() {
        $rootScope.modalInstance = $modal.open({
            templateUrl: vrmUi.getDashboardValue("WORKLOAD_DETAILS_URL"),
            backdrop: vrmUi.getDashboardValue("BACKDROP_STYLE_STATIC"),
            keyboard: false
        });
    };
    
    $scope.showPopup = function(){
    	if($scope.dashboardInfo.workloads.length != 0 && $scope.dashboardInfo.workloads != null){
    		 $scope.showWorkloadList();
    	} else {
    		$scope.showWorkloadConfiguration();
    	}
    };
});