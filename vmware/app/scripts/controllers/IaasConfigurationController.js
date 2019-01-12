vrmUI.controller('IaasConfigurationController', function($scope, $rootScope, $location, $route, $modal, IaasConfigurationService, DashboardService, $timeout, $filter){
    console.log('IAAS config controller loaded');

    $scope.isExisitingCluster = false;
    $scope.deployNewVcForClusters = true;
    $scope.isHeaderTabNetworkSelected = false;
    $scope.isWorkloadProfileFetched = false;
    $scope.reviewBackBtnCLicked = false;

    // Variable for screen navigation
    $scope.iaasConfigScreenShow = vrmUi.getIaasConfigurationValue("GENERAL"); //(general, security, system-config, review)

    // Error message variable
    $scope.iaasConfigurationErrorMessage = "";
    $scope.iaasConfig = {};
    $scope.iaasConfig.general = {};
    $scope.iaasConfig.general.requiredResources = {};
    $scope.iaasConfig.vcac = {};

    $scope.iaasConfig.review = {};
    $scope.range = /^([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$/;

    $scope.part1Ip = /^(0{0,2}[1-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$/;
    $scope.ntpRegEx = /^(((0{0,2}[1-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.(([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\.){2}([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5]))|((([a-zA-Z]+[0-9]*([-][a-zA-Z0-9]+)*)\.){1,4}[a-zA-Z]+))$/;
    $scope.vlanIdRegEx = /^([0]?[0-9]{1,3}|[1-3][0-9]{3}|40[0-8][0-9]|409[0-4])$/;
    var minRangeLoadedFlag = false;
    var maxRangeLoadedFlag = false;

    $scope.disableCPU = false;
    $scope.disableMemory = false;
    $scope.disableStorage = false;
    var isFinished = false;

    var fetchMaxRangeErrorMsg = '';
    $scope.progressComplete = false;
    $scope.ratioList = [];
    for(var i=3; i<=24; i++) {
        $scope.ratioList.push(i);
    }

    //Clear the submitted fields
    $scope.submitted = 0;

    var networks = {
        'VMOTION' : {
            'modelName' : 'vMotiondata',
            'formName' : 'formvmotion',
            'tabNumber' : 1,
            'key' : 'vmotionNetwork'
        },
        'VSAN' : {
            'modelName' : 'vSANdata',
            'formName' : 'formvsan',
            'tabNumber' : 2,
            'key' : 'vsanNetwork'
        },
        'VXLAN' : {
            'modelName' : 'vXlandata',
            'formName' : 'formvxlan',
            'tabNumber' : 3,
            'key' : 'vxlanNetwork'
        }
    };

    // Loading Mask
    $rootScope.ShowFullScreenLoading = false;
    $rootScope.ShowFullScreenLoadingMsg = '';

    /*
     * Helping Functions
     */
    $scope.disableSliders = function() {
        $scope.disableCPU = true;
        $scope.disableMemory = true;
        $scope.disableStorage = true;
    };

    //close popup
    $scope.cancel = function() {

    	console.log("workloadId :: " + $scope.iaasConfig.general.id);

    	//delete API call for deleteing workProfile ID
    	if(undefined != $scope.iaasConfig.general.id && $scope.iaasConfig.general.id != null) {
    		IaasConfigurationService.deleteWorkloadProfileById($scope.iaasConfig.general.id, function(data) {
        		//success call back
        	}, function(data) {
        		//error call back
        	});
    	}

    	// Stop the workload progress poll if the user closes the workload configuration popup
        $timeout.cancel($scope.fetchIaaSWorkloadProgress);

        $rootScope.IAASInstance.close();

        $location.path(vrmUi.getIaasConfigurationValue("DASHBOARD_URL"));
        $route.reload();
    };

    //save form data to json object
    $scope.createSystemdataIpObj = function(data) {
        var find = ',';
        var re = new RegExp(find, 'g');
        var tempObj = {};
        angular.forEach(data, function(value, key) {
            var tempVal = [];
            if(null != value && value.constructor == Object) {
                if(Object.keys(value).length == 4) {
                    var flag = true;
                    angular.forEach(value, function(val, k) {
                        if(flag) {
                            if(undefined == val) {
                                flag = false;
                            } else {
                                tempVal.push(val);
                            }

                        }
                    });
                    if(flag) {
                        this[key] = tempVal.toString().replace(re, ".");
                    }
                }
            } else {
                this[key] = value;
            }
        }, tempObj);
        return tempObj;
    };

    //on next click, navigate to next tab
    $scope.iaasWorkloadWorkflowNavigation = function(screenToShow) {
        console.log("Navigating to the screen: "+screenToShow);

        // First we clear the error message
        $scope.iaasConfigurationErrorMessage = "";

        //don't allow to navigate, if the workload is finished.
        if(isFinished) return;

        if(screenToShow == 'review') {
        	$scope.showIaaSConfigReview();
        }

        if($scope.isWorkloadProfileFetched == false) {
        	if($scope.isExisitingCluster == false && $scope.deployNewVcForClusters == true && $scope.isHeaderTabNetworkSelected == true){
            	$scope.isHeaderTabNetworkSelected = false;
            	return;
            }
        }

        if(screenToShow == 'network') {
        	if($scope.isWorkloadProfileFetched == false) {
        		$scope.showIaaSConfigReview();
        		$scope.iaasConfigScreenShow = 'review';
        	} else {
        		//then 1st check for the isExisitingCluster
        		if($scope.isExisitingCluster == false && $scope.deployNewVcForClusters == true) {
            		$scope.iaasConfigScreenShow = screenToShow;
            	} else if($scope.reviewBackBtnCLicked == true) {
            		$scope.reviewBackBtnCLicked = false;
            		$scope.iaasConfigScreenShow = 'system';
            	} else {
            		$scope.showIaaSConfigReview();
            		$scope.iaasConfigScreenShow = 'review';
            	}
        	}
        } else {
        	$scope.iaasConfigScreenShow = screenToShow;
        }

        if(screenToShow == vrmUi.getIaasConfigurationValue("GENERAL")) {
            $scope.iaasConfigurationErrorMessage = fetchMaxRangeErrorMsg;
        }
    };

    $scope.format = function() {
        $scope.minCPU = Math.round($scope.minCPU*100)/100;
        $scope.minMemory = Math.round($scope.minMemory*100)/100;
        $scope.minStorage = Math.round($scope.minStorage*100)/100;

        $scope.iaasConfig.general.requiredResources.cpu = $scope.minCPU;
        $scope.iaasConfig.general.requiredResources.memory = $scope.minMemory;
        $scope.iaasConfig.general.requiredResources.storage = $scope.minStorage;

        $scope.maxCPU = Math.round($scope.maxCPU*100)/100;
        $scope.maxMemory = Math.round($scope.maxMemory*100)/100;
        $scope.maxStorage = Math.round($scope.maxStorage*100)/100;
    };

    $scope.compareMinMax = function() {
        var disabled = false;
        var str = '';
        if($scope.minCPU > $scope.maxCPU) {
            $scope.disableCPU = true;
            disabled = true;
            str += $filter('translate')('iaasconfig.controller.CPU');
        }
        if($scope.minMemory > $scope.maxMemory) {
            $scope.disableMemory = true;
            disabled = true;
            str += $filter('translate')('iaasconfig.controller.MEMORY');
        }
        if($scope.minStorage > $scope.maxStorage) {
            $scope.disableStorage = true;
            disabled = true;
            str += $filter('translate')('iaasconfig.controller.STORAGE');
        }
        if(disabled) {
            $scope.iaasConfigurationErrorMessage = $filter('translate')('iaasconfig.controller.NOT_ENOUGH')+str+$filter('translate')('iaasconfig.controller.AVAILABLE');
        }
        $scope.format();
    };

    $scope.fetchMinMaxRange = function() {
        // Show Loading panel
        $rootScope.ShowFullScreenLoading = true;
        $rootScope.ShowFullScreenLoadingMsg = $filter('translate')('iaasconfig.controller.PLEASE_WAIT_FETCH_RANGE');

        //on page load, calculate min limit for cpu, memory, storage from host capacity
        $scope.minCPU = 0;
        $scope.minMemory = 0;
        $scope.minStorage = 0;

        $scope.iaasConfig.general.requiredResources.cpu=$scope.minCPU;
        $scope.iaasConfig.general.requiredResources.memory=$scope.minMemory;
        $scope.iaasConfig.general.requiredResources.storage=$scope.minStorage;
        minRangeLoadedFlag = true;

        //on page load, calculate max limit for cpu, memory, storage from available-allocated from dashboard screen
        DashboardService.buildResourcesForDashboard(function(data) {
            if(data.status == vrmUi.getIaasConfigurationValue("SUCCESS")) {
                if(undefined != data.object.cpu) {
                    var cpu = data.object.cpu;
                    console.log("Inside success for CPU stats "+cpu.available +" "+ cpu.allocated);
                    var mcpu = (cpu.available - cpu.allocated);
                    if(mcpu<0) mcpu = 0;
                    $scope.maxCPU = mcpu;
                } else {
                    $scope.maxCPU = 0;
                }

                if(undefined != data.object.memory) {
                    console.log("Inside success for Memory stats");
                    var memory = data.object.memory;
                    var mmem = (memory.available - memory.allocated);
                    if(mmem<0) mmem = 0;
                    $scope.maxMemory = mmem;
                } else {
                    $scope.maxMemory = 0;
                }

                if(undefined != data.object.storage) {
                    var storage = data.object.storage;
                    console.log("Inside success for Storage stats "+storage.rawAvailable+" "+storage.rawAllocated);
                    var mstorage = (storage.rawAvailable - storage.rawAllocated);
                    if(mstorage<0) mstorage = 0;
                    $scope.maxStorage = mstorage;
                } else {
                    $scope.maxStorage = 0;
                }

                maxRangeLoadedFlag = true;

                if(minRangeLoadedFlag) {
                    $scope.compareMinMax();
                    // Loading Mask
                    $rootScope.ShowFullScreenLoading = false;
                    $rootScope.ShowFullScreenLoadingMsg = '';
                }
            } else {
                $rootScope.ShowFullScreenLoading = false;
                $rootScope.ShowFullScreenLoadingMsg = '';
                $scope.iaasConfigurationErrorMessage = $filter('translate')('iaasconfig.controller.FETCH_MAX_RANGE_ERROR_MSG');
                fetchMaxRangeErrorMsg = $scope.iaasConfigurationErrorMessage;
                $scope.disableSliders();
            }
        }, function(data) {
            console.log('error in fetching donuts');
            $rootScope.ShowFullScreenLoading = false;
            $rootScope.ShowFullScreenLoadingMsg = '';
            $scope.iaasConfigurationErrorMessage = $filter('translate')('iaasconfig.controller.FETCH_MAX_RANGE_SERVER_ERROR')+data[vrmUi.getIaasConfigurationValue("CODE")];

            fetchMaxRangeErrorMsg = $scope.iaasConfigurationErrorMessage;
            $scope.disableSliders();
        });
    };

    //on review tab show all data from all configuration data and component data
    $scope.showIaaSConfigReview = function() {
        if(isFinished) return;

        $scope.finish = false;
        $scope.notEnoughResources = false;

        $scope.iaasConfigurationErrorMessage = '';

        // Show Loading panel
        $rootScope.ShowFullScreenLoading = true;
        $rootScope.ShowFullScreenLoadingMsg = $filter('translate')('iaasconfig.controller.LOADING_PLEASE_WAIT');

        var jsonData = {};
        $scope.iaasConfig.general.ratio = $scope.selectedRatio;
        jsonData.basicIaaSWorkloadConfiguration = angular.copy($scope.iaasConfig.general);

        if(undefined != $scope.iaasConfig.systemConfigdata) {
            $scope.systemData = angular.copy($scope.createSystemdataIpObj($scope.iaasConfig.systemConfigdata));
            jsonData.iaaSWorkloadSystemConfiguration = $scope.systemData;
        }

        /*console.log("================");
         console.log($scope.iaasConfig.systemConfigdata);
         console.log($scope.systemData);*/

        if(undefined != $scope.VSAN) {
            jsonData.vsanNetwork = $scope.VSAN;
        }
        if(undefined != $scope.VMOTION) {
            jsonData.vmotionNetwork = $scope.VMOTION;
        }
        if(undefined != $scope.VXLAN) {
            jsonData.vxlanNetwork = $scope.VXLAN;
        }

        if(undefined != $scope.iaasConfig.networkConfigData) {
            $scope.basicNetworkData = angular.copy($scope.createSystemdataIpObj($scope.iaasConfig.networkConfigData));
            jsonData.mgmtNetwork = $scope.basicNetworkData;
        }

        IaasConfigurationService.workLoadProfile(jsonData, function(data, status){
            if(data.status == vrmUi.getIaasConfigurationValue("SUCCESS")) {
            	$scope.isWorkloadProfileFetched = true;
            	//console.log(JSON.stringify(data));

            	//for testing...
            	//$scope.isExisitingCluster = true;

                $rootScope.ShowFullScreenLoading = false;
                $rootScope.ShowFullScreenLoadingMsg = '';

                //Show response from backend first..
                $scope.editClicked = 0;
                $scope.hosts = data.object.hosts;
                $scope.selectedRatio = data.object.ratio;
                $scope.iaasConfig.review = data.object;

                $scope.vCenters = data.object.clustersCount;
                $scope.allottedResources = data.object.allottedResources;
                $scope.usableStorage = data.object.usableStorage;
                $scope.deployNewVcForClusters = data.object.deployNewVcForClusters;
                
                console.log("==================");
                console.log(data.object.clusters);

                if(undefined != data.object.clusters) {
                	var clusters = data.object.clusters;
                	for(var i=0 ; i<clusters.length ; i++) {
                		var clusterObj = clusters[i];
                		if(clusterObj.exisitingCluster == true) {
                			$scope.isExisitingCluster = true;
                		}
                	}
                }

                if(undefined != data.object.mgmtNetwork) {
                    $scope.basicNetworkData = data.object.mgmtNetwork;
                    $scope.iaasConfig.networkConfigData = $scope.convertIpToParts($scope.basicNetworkData);
                }

                if(undefined != data.object.vmotionNetwork) {
                	$scope.VMOTION = data.object.vmotionNetwork;
                	$scope.vMotiondata = $scope.convertIpToParts($scope.VMOTION);
                }

                if(undefined != data.object.vsanNetwork) {
                	$scope.VSAN = data.object.vsanNetwork;
                	$scope.vSANdata = $scope.convertIpToParts($scope.VSAN);
                }

                if(undefined != data.object.vxlanNetwork) {
                	$scope.VXLAN = data.object.vxlanNetwork;
                	$scope.vXlandata = $scope.convertIpToParts($scope.VXLAN);
                }

                angular.forEach(data.object.resources, function(value, key){
                    $scope.allottedResources[key] = Math.round(value*100)/100;
                });
                $scope.clusters = data.object.clusters;
                $scope.iaasConfig.general.id = data.object.id;
                if(false == data.object.capacityAvailable) {
                    if(undefined != data.object.hosts && undefined != data.object.availableHosts && null != data.object.hosts && null != data.object.availableHosts) {
                        $scope.iaasConfigurationErrorMessage = $filter('translate')('iaasconfig.controller.NOT_ENOUGH_RESOURCES')+data.object.hosts+$filter('translate')('iaasconfig.controller.HOSTS_MSG')+data.object.availableHosts+ $filter('translate')('iaasconfig.controller.HOSTS');
                    } else {
                        $scope.iaasConfigurationErrorMessage = $filter('translate')('iaasconfig.controller.NOT_ENOUGH_RESOURCES1');
                    }

                    $scope.notEnoughResources = true;
                }
            } else {
                $rootScope.ShowFullScreenLoading = false;
                $rootScope.ShowFullScreenLoadingMsg = '';
                $scope.iaasConfigurationErrorMessage = $filter('translate')('iaasconfig.controller.FETCH_COMPONENT_INFO_ERROR_MSG');
            }
        }, function(data, status) {
            $rootScope.ShowFullScreenLoading = false;
            $rootScope.ShowFullScreenLoadingMsg = '';
        });
    };

    //validate all IaaS forms
    $scope.validateAllIaaSForms = function() {
        var formNames = [vrmUi.getIaasConfigurationValue("GENERAL_FORM"), vrmUi.getIaasConfigurationValue("WORKLOAD_FORM"), vrmUi.getIaasConfigurationValue("SYSTEM_CONFIG_FORM"), 'formIaaSNetworkConfig'];
        //var screens = [vrmUi.getIaasConfigurationValue("GENERAL"), vrmUi.getIaasConfigurationValue("WORKLOAD"), vrmUi.getIaasConfigurationValue("SYSTEM")];
        var flag = true;

        angular.forEach(formNames, function(val, ind) {
            if(flag) {
                if(!$scope[val].$valid) {
                    flag = false;
                }
            }
        });
        return flag;
    };



    //on finish button click, submit all data to server
    $scope.submitIaaSConfigReview = function() {
        console.log("Submitting the review form to create a workload configuration for workloadId: "+$scope.workloadResponse);
        $scope.finish = false;
        $scope.iaasConfigurationErrorMessage = '';

        if($scope.validateAllIaaSForms()) {
        	$rootScope.ShowFullScreenLoading = true;
            $rootScope.ShowFullScreenLoadingMsg = 'Loading...';

        	var jsonData = {};
            jsonData.basicIaaSWorkloadConfiguration = angular.copy($scope.iaasConfig.general);
            jsonData.iaaSWorkloadSystemConfiguration = angular.copy($scope.systemData);

            if(undefined != $scope.basicNetworkData) {
                jsonData.mgmtNetwork = $scope.basicNetworkData;
            }
            if(undefined != $scope.VSAN) {
            	jsonData.vsanNetwork = $scope.VSAN;
            }
            if(undefined != $scope.VMOTION) {
            	jsonData.vmotionNetwork = $scope.VMOTION;
            }
            if(undefined != $scope.VXLAN) {
            	jsonData.vxlanNetwork = $scope.VXLAN;
            }

            IaasConfigurationService.finishWorkloadConfiguration($scope.iaasConfig.general.id, function(data, status) {
                $rootScope.ShowFullScreenLoading = false;
                $rootScope.ShowFullScreenLoadingMsg = '';
                if(data.status == vrmUi.getIaasConfigurationValue("SUCCESS")) {
                    $scope.workloadResponse = data.object;

                    isFinished = true;
                    console.log('Iaas config saved successfully');

                    $rootScope.iaasProcessInstance = $modal.open({
                        templateUrl: vrmUi.getIaasConfigurationValue("IAAS_TRIGGER_PROCESS"),
                        size: vrmUi.getIaasConfigurationValue("SIZE"),
                        backdrop: vrmUi.getIaasConfigurationValue("BACKDROP"),
                        keyboard: false
                    });
                } else {
                    $scope.iaasConfigurationErrorMessage = $filter('translate')('iaasconfig.controller.SAVE_IAAS_ERROR_MSG');
                }
            }, function(data, status) {
                $rootScope.ShowFullScreenLoading = false;
                $rootScope.ShowFullScreenLoadingMsg = '';
                if(undefined == data.message || null == data.message || "" == data.message) {
                    $scope.iaasConfigurationErrorMessage = $filter('translate')('iaasconfig.controller.SAVE_IAAS_SERVER_ERROR')+data[vrmUi.getIaasConfigurationValue("CODE")]+ " " +data[vrmUi.getIaasConfigurationValue("MESSAGE")];
                } else {
                    $scope.iaasConfigurationErrorMessage = data.message;
                }
            });
        } else {
            $scope.finish=true;
            $scope.iaasConfigurationErrorMessage = $filter('translate')('iaasconfig.controller.FILL_ALL_FIELDS');
        }
    };

    $scope.closeIAASAndProcessPopup = function() {
        $rootScope.IAASInstance.close();
        $rootScope.iaasProcessInstance.close();
    };

    $scope.convertObjectToIp = function(data) {
        var find = ',';
        var re = new RegExp(find, 'g');
        var tempObj = {};
        angular.forEach(data, function(value, key) {
            var tempVal = [];
            if(null != value && value.constructor == Object && Object.keys(value).length > 1) {
                angular.forEach(value, function(val, k) {
                    tempVal.push(val);
                });
                this[key] = tempVal.toString().replace(re, ".");
            } else {
                this[key] = value;
            }
        }, tempObj);
        return tempObj;
    };

    //split ip address format data in parts to display in text fields
	$scope.convertIpToParts = function(networkObj) {
		var tempObj = {};
		angular.forEach(networkObj, function(value, key) {

			if(key != 'subnet' && key != 'subnetMask' && key != 'gateway' && key != 'dns'/* && key != 'ntp'*/) {
				var val = value;
				if(key == 'vlanId') {
					if(value == 0) {
						val ="";
					}
				}
				this[key] = val;
			} else {
				if(null != value) {
					var splitArray = value.split(".");
					var tempIpObj = {};
					angular.forEach(splitArray, function(val, ind) {
						tempIpObj['part'+(ind+1)] = splitArray[ind];
					}, tempIpObj);
					this[key] = tempIpObj;
				}
			}
		}, tempObj);
		return tempObj;
	};

    $scope.validateForm = function(formName, nextPage) {
    	if($scope[formName].$valid) {
    		$scope.submitted = 0;

    		if(nextPage == 'review') {
    			$scope.iaasWorkloadWorkflowNavigation(nextPage);
    		} else if(nextPage == 'advancedPhysicalConfig') {
    			$scope.showNetworkSetup = true;
    			$scope.phySetup = 1;
    		} else {
    			$scope.iaasWorkloadWorkflowNavigation(nextPage);
    		}
    	} else {
    		$scope.submitted = 1;
    	}
    };

    $scope.validateTab = function(type) {
        $scope.submitted = 0;
        $scope.showUpdateMessage = 0;
        var currentTab = networks[type].tabNumber;
        var flag = true;

        if($scope[networks[type].formName].$valid) {
            angular.forEach(networks, function(object, key) {
                if(flag && $scope[object.formName].$invalid && currentTab > object.tabNumber) {
                    $scope.phySetup = object.tabNumber;
                    $scope.submitted = object.tabNumber;
                    flag = false;
                }
            });
            if(flag && type != 'VXLAN') {
                $scope.phySetup = currentTab + 1;
            } else if(flag && type == 'VXLAN') {
                angular.forEach(networks, function(object, key) {
                    $scope[object.modelName].networkType = key;
                    var jsonObj = $scope.convertObjectToIp($scope[object.modelName]);
                    $scope[key] = jsonObj;
                });
                $scope.iaasWorkloadWorkflowNavigation('review');
            }
        } else {
            $scope.submitted = currentTab;
        }
    };

    $scope.back = function() {
        $scope.submitted = 0;
        $scope.showNetworkSetup = false;
    };


    $scope.confirmvCAC = function () {
        $scope.submitted = 1;

        $rootScope.vcac = {};
        $rootScope.vcac.iaasHost = $scope.iaasConfig.vcac.iaasHost;
        $rootScope.vcac.vcacHost = $scope.iaasConfig.vcac.vcacHost;
        $rootScope.vcac.password = $scope.iaasConfig.vcac.password;
        $rootScope.vcac.isoFileName =  $scope.systemConfig.isoFileName;
        $rootScope.vcac.licenseKey  = $scope.systemConfig.licenseKey;

        if($scope.formvCACConfiguration.$invalid) {
            // Do not validate is Use Existing Network is selected
        } else {
            $scope.confirmvCAC2 ($scope.systemConfig);
        }
    };


    $scope.confirmvCAC2 = function(data) {
        console.log("Submitting the security screen on workload configuration: ");
        console.log(data);

        // Prepare data needed by the system config
        var systemVDIWorkloadConfigurationObject = new Object();

        //checking iso file extension
        var isofilename = data["isoFileName"];
        if (null != isofilename && undefined != isofilename) {
            var isovalues = isofilename.split(".");
            $scope.isofileextension = isovalues[isovalues.length-1];
        }

        console.log("Extension="+$scope.isofileextension);

        systemVDIWorkloadConfigurationObject.windowsIsoFile = data["isoFileName"];
        systemVDIWorkloadConfigurationObject.windowsLicenseKey = data["licenseKey"];

        var flag = false;
        $scope.iaasConfigurationErrorMessage  = "";
        if($scope.isoFileUploadComplete == false){
            //chk ISO the file is selected or not
            if($scope.isoFileSelected == true && $scope.isofileextension == vrmUi.getWorkloadConfigurationValue("ISO")){
                $timeout(function() {
                    var el = document.getElementById(vrmUi.getWorkloadConfigurationValue("SELECTED_ISO_FILE"));
                    angular.element(el).triggerHandler(vrmUi.getWorkloadConfigurationValue("CLICK"));
                }, 0);

                flag = true;

                $rootScope.modalInstance = $modal.open({
                    templateUrl: vrmUi.getWorkloadConfigurationValue("VCAC_PROGRESS"),
                    size: vrmUi.getWorkloadConfigurationValue("SIZE"),
                    backdrop: vrmUi.getWorkloadConfigurationValue("BACKDROP"),
                    keyboard: false
                });
            } else {
                $scope.iaasConfigurationErrorMessage  = $filter('translate')('workloadconfiguration.controller.SELECT_ISO_FILE');
                return;
            }
        } else {
            $scope.confirmvCACContinue();
        }

        // Hide the loading mask
        $rootScope.ShowFullScreenLoading = false;
        $rootScope.ShowFullScreenLoadingMsg = '';


    };



    $scope.confirmvCACContinue = function () {
        // If file upload is in progress .. notify the user that he can't close the box until the upload is complete
        if ($scope.isoFileUploadProgress) {
            console.log("Issue="+$scope.isofileextension);
            $scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.FILE_UPLOAD_PROGRESS');
            return;
        }

        console.log("No issue");
        // Show a warning message to the user that if he cancels .. all unsaved data will be lost

        IaasConfigurationService.allocatevCACIP($scope.iaasConfig.general.id, function (data) {
            //success call back
            $rootScope.ShowFullScreenLoading = false;
            $rootScope.ShowFullScreenLoadingMsg = '';


            $rootScope.vcac.workloadId = data.object.workloadId;
            $rootScope.vcac.iaasIp = data.object.iaasIp;
            $rootScope.vcac.vcacIp = data.object.vcacIp;


            $rootScope.vcacConfirmationInstance = $modal.open({
                templateUrl: vrmUi.getWorkloadConfigurationValue("VCAC_CONFIRMATION_URL"),
                size: vrmUi.getWorkloadConfigurationValue("SIZE"),
                backdrop: vrmUi.getWorkloadConfigurationValue("BACKDROP"),
                keyboard: false
            });


        }, function (data) {
            //error call back
        });


    };


    $scope.vcacConfirmClose = function() {
        var data = {};
        data.iaasIp =  $rootScope.vcac.iaasIp;
        data.vcacIp =  $rootScope.vcac.vcacIp;
        data.workloadId = $rootScope.vcac.workloadId;
        IaasConfigurationService.deletevCACIP(data, function (data) {
            //success call back
            $rootScope.vcacConfirmationInstance .close();
        }, function (data) {
            //error call back
        });

    };

    $scope.vcacCloseModal = function() {
        var data = {};
        data.iaasIp =  $rootScope.vcac.iaasIp;
        data.vcacIp =  $rootScope.vcac.vcacIp;
        data.workloadId = $rootScope.vcac.workloadId;
        $rootScope.vcacConfirmationInstance .close();
    }



    $scope.vcacConfirmStart = function() {

        console.log("Confirmed start workflowId: "+$rootScope.rootScopeWorkloadId);

        // Show loading mask
        $rootScope.ShowFullScreenLoading = true;
        $rootScope.ShowFullScreenLoadingMsg = $filter('translate')('workloadconfiguration.controller.STARTING_WORKLOAD_WAIT_MESSAGE');

        var da = {};
        da.vcacHost = $rootScope.vcac.vcacHost;
        da.vcacIp =  $rootScope.vcac.vcacIp;
        da.password = $rootScope.vcac.password;
        da.iaasHost = $rootScope.vcac.iaasHost;
        da.iaasIp = $rootScope.vcac.iaasIp;
        da.isoLocation =  $rootScope.vcac.isoFileName;
        da.windowsSerial = $rootScope.vcac.licenseKey;
        da.workloadId = $rootScope.vcac.workloadId;

        // Call to delete the workload id from the ZK
        IaasConfigurationService.startvCACWorkflow(da, function(data) {
            // Hide loading mask
            $rootScope.ShowFullScreenLoading = false;
            $rootScope.ShowFullScreenLoadingMsg = "";
            $scope.vcacCloseModal();
            $rootScope.IAASInstance.close();
        }, function(data) {

            // Hide loading mask
            $rootScope.ShowFullScreenLoading = false;
            $rootScope.ShowFullScreenLoadingMsg = "";
            $scope.vcacCloseModal();
            $rootScope.IAASInstance.close();
        });


    };

    $scope.showvCACForm = function() {
        // fetch the VDI configuration in order to retrieve windows ISO constants

        $scope.submitted = 0;
        // Show Loading panel
        $rootScope.ShowFullScreenLoading = true;
        $rootScope.ShowFullScreenLoadingMsg = $filter('translate')('workloadconfiguration.controller.FETCHING_WORKLOAD_CONFIG_LOADING_MSG');

        // Call to fetch workload configuration
        IaasConfigurationService.getLastIso(function(data, status) {
            console.log("Fetched the workload configuration: ");
            console.log(data);

            $rootScope.ShowFullScreenLoading = false;
            $rootScope.ShowFullScreenLoadingMsg = '';

            $scope.setScopeVariablesForUI(data);

        }, function(data, status) {
            $rootScope.ShowFullScreenLoading = false;
            $rootScope.ShowFullScreenLoadingMsg = '';
        });
    };


    $scope.setScopeVariablesForUI = function(data) {
        if ($scope.systemConfig==undefined)  $scope.systemConfig = new Object();

        console.log("System VDI Workload configuration fetched from the server .. so assign it to the scope object: ");

        if($scope.systemConfig["isoFileName"] != null && $scope.systemConfig["isoFileName"] != undefined && $scope.systemConfig["isoFileName"] != "") {
        } else {

            $scope.systemConfig["isoFileName"] = data.object;

        }

        $timeout(function() {
            $scope.iaasWorkloadWorkflowNavigation('vcac-config');
        }, 0);

    };

    $scope.isoFileAdded = function() {
        $scope.isoFileSelected = true;
        console.log("ISO File added");
        $scope.isoFileUploadComplete = false;
        $rootScope.existingISOPresent = 0;
        $rootScope.isoFileUploadError = false;
    };

    $scope.isoFileComplete = function() {
        console.log("ISO File complete");
        $scope.isoFileUploadComplete = true;
        $scope.isoFileUploadProgress = false;
        $rootScope.existingISOPresent = 0;
        $rootScope.isoFileUploadError = false;
    };

    $scope.isoFileProgress = function(flowObj) {
        $rootScope.isoProgressValue = flowObj.progress();

        $scope.isoFileUploadProgress = true;
        $rootScope.existingISOPresent = 0;
        $rootScope.isoFileUploadError = false;
    };

    $scope.isoFileError = function(flowObj) {
        $scope.isoFileUploadProgress = false;
        $scope.isoFileUploadComplete = false;
        $rootScope.isoFileUploadError = true;
    };

    $scope.cancelUpload = function(){
        $timeout(function() {
            var el = document.getElementById(vrmUi.getWorkloadConfigurationValue("CANCEL_ISO_UPLOAD"));
            angular.element(el).triggerHandler(vrmUi.getWorkloadConfigurationValue("CLICK"));

            var el = document.getElementById(vrmUi.getWorkloadConfigurationValue("CANCEL_OVA_UPLOAD"));
            angular.element(el).triggerHandler(vrmUi.getWorkloadConfigurationValue("CLICK"));
        }, 0);

        $rootScope.modalInstance.close();
    };

    $scope.finishedUpload = function() {
        // Check if any file upload is in progress or not .. if yes .. then return
        if($scope.isoFileUploadProgress || $scope.ovaFileUploadProgress) {
            console.log("File uploads currently in progress ... hence returning");
            return false;
        } else {
            console.log("Finished upload ");

            $rootScope.modalInstance.close();
            $scope.confirmvCACContinue();
        }
    };

    $scope.uploadComplete = function() {
        if(($rootScope.isoProgressValue == 1) || ($rootScope.isoProgressValue == undefined))
        {
            return true;
        }
        return false;
    };


});

