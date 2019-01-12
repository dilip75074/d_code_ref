/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.controller('PhysicalResourcesController', function($scope, $rootScope, $modal, PhysicalResourcesService, NetworkConfigService, PhysicalNetworkSetupService, $filter) {
	$scope.showtooltip = false;
	$scope.showRacks = false;
	$scope.nics=[];
    var nic=[];
	var nics=[];
	/**
	 * this method is called only if the remote console display type for the host
	 * is of the type JNLP
	 */
	$scope.jnlpRemoteConsoleDisplay = function(fileName,nodeId) {

		PhysicalResourcesService.getRemoteConsoleDisplay(nodeId,'jnlpConsole',function(data){
			var content = data.object;
			/*var blob = new Blob([content]);
			var url = webkitURL.createObjectURL(blob);*/
			
			var pom = document.createElement('a');
			  pom.setAttribute('href', 'data:attachment/x-java-jnlp-file,' + encodeURI(content));
			  pom.setAttribute('target', '_blank');
			  pom.setAttribute('download', fileName);
			  document.body.appendChild(pom);
			  pom.click();
			  
			pom.remove(); 
			/*var blob = new Blob([content]);
			var evt = document.createEvent("HTMLEvents");
			evt.initEvent("click");
			$("<a>", {
				download: fileName,
				href: webkitURL.createObjectURL(blob)
			}).get(0).dispatchEvent(evt);*/
			 
		},function(data){
			console.log("cannot get the jnlp file contents");
		});

	};
	/*$scope.waitAndErrorMsg = "Please wait...";*/
	//$scope.uuid = null;
	//$scope.serviceRackId = null;
	$scope.activeDiv = null;
	$scope.thirdDivActive = false;
	$scope.vrackConfigdata = null;
	$scope.networkConfigdata = null;

	// Loading Mask
	$rootScope.ShowFullScreenLoading = false;
	$rootScope.ShowFullScreenLoadingMsg = '';

	$scope.extConnection = [];
	$scope.connectionDetail = [];
	$scope.firsttime = true;

	$scope.hideTooltip = function() {

		$scope.showtooltip = false;

	};

	$scope.toggleTooltip = function(e) {
		e.stopPropagation();
		$scope.showtooltip = !$scope.showtooltip;
		if($scope.showtooltip)
		{
			if($rootScope.isSDNPresent){
				// Show Loading Mask
				$rootScope.ShowFullScreenLoading = true;
				$rootScope.ShowFullScreenLoadingMsg = $filter('translate')('physicalresource.controller.SHOW_FULLSCREEN_LOADING_MSG');

				NetworkConfigService.fetchNetworkConfigProperties(function(data){
					// Loading Mask
					$rootScope.ShowFullScreenLoading = false;
					$rootScope.ShowFullScreenLoadingMsg = '';

					console.log("Inside success for fetch Properties for network config for the network config screen, data: ");
					console.log(data);
					$scope.vrackConfigdata = data["vrackConfigdata"];
					$scope.networkConfigdata = data["networkConfigdata"];
				},function(data){
					// Loading Mask
					$rootScope.ShowFullScreenLoading = false;
					$rootScope.ShowFullScreenLoadingMsg = '';
				});
			}else{
				PhysicalNetworkSetupService.fetchAllNetworkSetups(function(data){

					if(data.status == vrmUi.physicalResourceControllerValue("SUCCESS"))
					{
						console.log(data);
						$scope.extConnection = [];
						$scope.connectionDetail = [];
						for(var obj in data.object){        					
							if(data.object[obj].networkType == vrmUi.physicalResourceControllerValue("EXTERNAL_CONNECTION"))
								$scope.extConnection.push(data.object[obj]);
							else
								$scope.connectionDetail.push(data.object[obj]);
						}
					}
				},function(data){});
			}
		}
	};

	$scope.closeTooltip = function(e) {
		$scope.showtooltip = false;
	};

	$scope.getRackList = function() {
		// show Loading Mask
		$rootScope.ShowFullScreenLoading = true;
		$rootScope.ShowFullScreenLoadingMsg = $filter('translate')('physicalresource.controller.LOADING_RACK_LIST');
		$scope.clear();
		PhysicalResourcesService.getAllRack(function(data) {
			// Loading Mask
			$rootScope.ShowFullScreenLoading = false;
			$rootScope.ShowFullScreenLoadingMsg = '';

			if (data.status != vrmUi.physicalResourceControllerValue("FAILED") && null != data.object) {
				$scope.showRacks = true;
				if (data.object.length>0){
					$scope.rackList = data.object;
				}
				else {
					$scope.waitAndErrorMsg = '';
					$scope.rackListError = $filter('translate')('physicalresource.controller.NORACK_LIST_ERROR');
				}
			} else {
				$scope.showRacks = true;
				$scope.waitAndErrorMsg = '';
				$scope.rackListError = $filter('translate')('physicalresource.controller.FAILED_RACK_LIST_ERROR');
			}

		}, function(data) {
			// Loading Mask
			$rootScope.ShowFullScreenLoading = false;
			$rootScope.ShowFullScreenLoadingMsg = '';

			$scope.showRacks = false;
			$scope.rackListError = $filter('translate')('physicalresource.controller.FAILED_RACK_LIST_ERROR');
			$scope.waitAndErrorMsg = $filter('translate')('physicalresource.controller.FETCH_RACK_LIST_ERROR')+data["code"];
		});
	};

	$scope.loadRackDetails = function(selectedRack, uuid, id) {
		//alert("Inside loadRackDetails...");
		// show Loading Mask
		$rootScope.ShowFullScreenLoading = true;
		$rootScope.ShowFullScreenLoadingMsg = $filter('translate')('physicalresource.controller.SHOW_FULLSCREEN_LOADING_MSG');

		$scope.selectedRack = selectedRack;
		$scope.clear();
		PhysicalResourcesService.getRackHost(uuid, function(data) {

			// Loading Mask
			$rootScope.ShowFullScreenLoading = false;
			$rootScope.ShowFullScreenLoadingMsg = '';

			if (data.status != vrmUi.physicalResourceControllerValue("FAILED") && null != data.object) {
				$scope.rackUUID = data.object.uuid;
				$rootScope.hostList = data.object;
				console.log("hostList :::::::");
				console.log(JSON.stringify($rootScope.hostList));

			} else {
				$rootScope.rackHostsError = $filter('translate')('physicalresource.controller.FAILED_HOST_LIST_ERROR');
			}

		}, function(data) {
			// Loading Mask
			$rootScope.ShowFullScreenLoading = false;
			$rootScope.ShowFullScreenLoadingMsg = '';

			$rootScope.rackHostsError = $filter('translate')('physicalresource.controller.FAILED_LOAD_HOST_LIST')+data["code"];
		});
		$rootScope.uuid = uuid;
		if($scope.thirdDivActive == false)
			$scope.shoWDiv('div2');
		else
			$scope.shoWDiv('div3');
	};

	$scope.loadHostDetails = function(selectedHost, rackUUID, hostId, node) {
		$scope.nics=[];
	    var nic=[];
		var nics=[];
		console.log("Node==="+node);
		$scope.isHostSelected = true;
		// show Loading Mask
		$rootScope.ShowFullScreenLoading = true;
		$rootScope.ShowFullScreenLoadingMsg = $filter('translate')('physicalresource.controller.SHOW_FULLSCREEN_LOADING_MSG');

		$scope.selectedHost = selectedHost;
		$scope.showSwitch = false;

		$scope.selectedHostId = hostId;
		$scope.clear();
		PhysicalResourcesService.getHostDetails(rackUUID, hostId, function(data) {

			// Loading Mask
			$rootScope.ShowFullScreenLoading = false;
			$rootScope.ShowFullScreenLoadingMsg = '';

			if (data.status != vrmUi.physicalResourceControllerValue("FAILED") && null != data.object) {
				$rootScope.hostDetail = data.object;
				console.log(JSON.stringify($rootScope.hostDetail));
			} else {
				$rootScope.rackHostDetailError = $filter('translate')('physicalresource.controller.FAILED_LOAD_HOST_DETAILS');
			}
			
	

		}, function(data) {
			// Loading Mask
			$rootScope.ShowFullScreenLoading = false;
			$rootScope.ShowFullScreenLoadingMsg = '';

			$rootScope.rackHostDetailError = $filter('translate')('physicalresource.controller.FAILED_LOAD_HOST_DETAILS_ERROR')+data["code"];
		});
		
		
		PhysicalResourcesService.getHostInformation(node, function(data) {
			if (data.status.toLowerCase() != "failed" &&  data.object!=null) {
				console.log("hostDetail================"+JSON.stringify(data));
				var hobject=data;
				var hostObject=hobject.object;


				for(host in hostObject){
					var manufacturerObject=hostObject[host];
					//var maxLinkSpeed=manufacturerObject.maxLinkSpeed;
					var manufacturer=manufacturerObject.manufacturer;
					var productName=manufacturerObject.productName;
					//var driver=manufacturerObject.driver;
					
					nic=manufacturerObject.portInfos;
					console.log("device name"+$scope.deviceNames);
					console.log("NIC Info "+JSON.stringify(nic));
					for(nicobj in nic){
						var nicTemp = Object.create(null);	

						nicTemp.manufacturer=manufacturer;
						nicTemp.productName=productName;
						nicTemp.driver=nic[nicobj].driver;
						nicTemp.currentLinkSpeed=nic[nicobj].currentLinkSpeed.speed+" "+nic[nicobj].currentLinkSpeed.unit;
						nicTemp.maxLinkSpeed=nic[nicobj].maxLinkSpeed.speed+" "+nic[nicobj].maxLinkSpeed.unit;
						nicTemp.macAddress=nic[nicobj].macAddress;
						//nicTemp.gratituousARPInterval=nic[nicobj].gratituousARPInterval;
						nicTemp.nicName=nic[nicobj].deviceName;
						nicTemp.linkStatus=nic[nicobj].linkStatus;
						nics.push(nicTemp);
					}

				}
				$scope.nics=nics;
			}else {
				$scope.hosterror = "Failed to load switch information";	
			}

		}, function(data) {
			// Loading Mask
			$rootScope.ShowFullScreenLoading = false;
			$rootScope.ShowFullScreenLoadingMsg = '';
			$scope.showRacks = false;
			$scope.rackListError = $filter('translate')('physicalresource.controller.FAILED_RACK_LIST_ERROR');
			$scope.waitAndErrorMsg = $filter('translate')('physicalresource.controller.FETCH_RACK_LIST_ERROR')+data["code"];
		});

		$scope.serviceRackId = hostId;
		$scope.shoWDiv('div3');
	};
	
	$scope.showHostInterfaceDetails=function(nic){
		console.log("Fetching...."+nic);
		if(nic!=null){
			for(nicobj in $scope.nics){

				if(nic==$scope.nics[nicobj].nicName.toLowerCase()){
					console.log("==================="+nic[nicobj].linkStatus);
					$scope.nicDetails={
							"manufacturer":$scope.nics[nicobj].manufacturer,
							"productName":$scope.nics[nicobj].productName,
							"driver":$scope.nics[nicobj].driver,
							"maxLinkSpeed":$scope.nics[nicobj].maxLinkSpeed,
							"macAddress":$scope.nics[nicobj].macAddress,
							"currentLinkSpeed":$scope.nics[nicobj].currentLinkSpeed,
							"nicName":nic[nicobj].nicName,
							"linkStatus":$scope.nics[nicobj].linkStatus
					};
					break;
				}
			}
		}
		console.log($scope.nicDetails);
	};

	$scope.loadSwitchDetails = function(selectedSwitch, item) {
		$scope.isHostSelected = false;
		$scope.selectedHost = selectedSwitch;
		$scope.showSwitch = true;
		$scope.switchDetail = item;
		console.log(JSON.stringify($scope.switchDetail));
		
		$scope.selectedHostId = item.nodeId;
		console.log("-----id.."+item.id);
		
		PhysicalResourcesService.getSwitchInformation(item.nodeId,function(data) {
			console.log("Fetching switch port stats");
			if (data.status.toLowerCase() != "failed" &&  data.object!=null) {
				console.log("switchDetail================"+JSON.stringify(data));
				var interfaceDetails= data;
				console.log(interfaceDetails);
				$scope.interfaces=interfaceDetails.object;
			} else {
				$scope.switcherror = "Failed to load switch information";
			}

		}, function(data) {
			// Loading Mask
			$rootScope.ShowFullScreenLoading = false;
			$rootScope.ShowFullScreenLoadingMsg = '';
			$scope.showRacks = false;
			//$scope.rackListError = $filter('translate')('physicalresource.controller.FAILED_RACK_LIST_ERROR');
			//$scope.waitAndErrorMsg = $filter('translate')('physicalresource.controller.FETCH_RACK_LIST_ERROR')+data["code"];
		});

		//console.log("selectedHostId :: " + $scope.selectedHostId);

		$scope.shoWDiv('div3');
	};

	$scope.showInterfaceDetails=function(interfaceId){
		console.log("fetching"+interfaceId);
		if(interfaceId!=null)
		{
			var interfaces=$scope.interfaces;
			for(interfaceobj in interfaces){
				if(interfaces[interfaceobj].name==interfaceId){
					var stats=interfaces[interfaceobj].statistics;
					var status="Healthy";
					if(stats.txErrors>0 || stats.rxErrors>0 ){
						status="Error";
					}
					$scope.interfDetails={
							"interfaceName" :interfaces[interfaceobj].name,
							"interfaceMacAddress":interfaces[interfaceobj].macAddress,
							"speed":interfaces[interfaceobj].speed,
							"flags":interfaces[interfaceobj].flags,
							"status":interfaces[interfaceobj].status,
							"errstatus":status,
							"mtu":interfaces[interfaceobj].mtu,
							"type":interfaces[interfaceobj].type
					};
				}
			}
		}
	};
	
	//clear all variables
	$scope.clear = function() {
		$rootScope.rackHostsSuccess = "";
		$rootScope.rackHostDetailError = "";
		$rootScope.rackHostsError = "";
		$rootScope.rackHostDetailSuccess = "";
		$scope.rackListError = "";
	};

	$scope.shoWDiv = function(divId) {
		/* $rootScope.rackHostsSuccess = "";
        $rootScope.rackHostDetailError = "";
        $rootScope.rackHostsError = "";
        $rootScope.rackHostDetailSuccess = "";
        $scope.rackListError = "";*/

		if (divId == 'div1') {
			$scope.hideAllDivs();
			$scope.div1Flag = true;
		} else if (divId == 'div2') {
			$scope.hideAllDivs();
			$scope.div2Flag = true;
			$scope.thirdDivActive = false;
		} else if (divId == 'div3') {
			$scope.hideAllDivs();
			$scope.div3Flag = true;
			$scope.thirdDivActive = true;
		} else if (divId == 'listview') {
			$scope.listViewFlag = true;
			$scope.mapViewFlag = false;
		} else if (divId == 'mapview') {
			$scope.mapViewFlag = true;
			$scope.listViewFlag = false;
		}

		/*$rootScope.rackHostsSuccess = "";
        if (divId == 'div1') {
            $scope.hideAllDivs();
            $scope.div1Flag = true;
        } else if (divId == 'div2') {
            $scope.clear();
            $scope.hideAllDivs();
            $scope.div2Flag = true;
            $scope.thirdDivActive = false;
        } else if (divId == 'div3') {
            $scope.clear();
            $scope.hideAllDivs();
            $scope.div3Flag = true;
            $scope.thirdDivActive = true;
        } else if (divId == 'listview') {
            $scope.listViewFlag = true;
            $scope.mapViewFlag = false;
        } else if (divId == 'mapview') {
            $scope.mapViewFlag = true;
            $scope.listViewFlag = false;
        }
        
        /*$rootScope.rackHostsSuccess = "";
        //$rootScope.rackHostsError = "";
        $rootScope.rackHostDetailError = "";
        $rootScope.rackHostDetailSuccess = "";*/
	};

	$scope.hideAllDivs = function() {
		$scope.div1Flag = false;
		$scope.div2Flag = false;
		$scope.div3Flag = false;
	};

	$scope.cancelPopup = function() {
		$rootScope.rackHostsSuccess = "";
		$rootScope.rackHostDetailError = "";
		$rootScope.rackHostsError = "";
		$rootScope.rackHostDetailSuccess = "";
		$scope.rackListError = "";
		$rootScope.modalInstance1.close();
	};

	$scope.cancel = function() {
		$rootScope.rackHostsSuccess = "";
		$rootScope.rackHostDetailError = "";
		$rootScope.rackHostsError = "";
		$rootScope.rackHostDetailSuccess = "";
		$scope.rackListError = "";
		$rootScope.modalInstance.close();
	};
	$scope.remoteConsoleType = [];
	$scope.isRemoteConsoleAvailable = function(hostId){
		
		if(typeof $scope.remoteConsoleType[hostId] == "undefined"){
			PhysicalResourcesService.getRemoteConsoleDetails(hostId, function(data) {
				//alert("details found :"+data);
				$scope.remoteConsoleType[hostId] = data.object;
				console.log("remote console details found :"+ $scope.remoteConsoleType[hostId]);


			}, function(data) {
				$scope.remoteConsoleType[hostId] ="not available";
				console.log("could not get remote console details");

			});
		}
		

	}

	$scope.getRemoteConsoleJnlpFile = function(hostId){
		window.open('/api/1.0/../../json/physicalRackList.json','_blank')
		//alert($scope.appPath);
	}

	$scope.hostManagement = function(hostId, actionType, isHost){
		//console.log("hostId :: " + hostId); console.log("isHost :: " + isHost);
		if(actionType==vrmUi.physicalResourceControllerValue("ACTION_TYPE_CYCLEHOST"))
		{
			if(isHost==true){
				$rootScope.powerCycleType = $filter('translate')('physicalresource.controller.POWER_CYCLETYPE_CYCLE_HOST')+hostId;
			}else{
				$rootScope.powerCycleType = $filter('translate')('physicalresource.controller.POWER_CYCLETYPE_CYCLE_SWITCH')+hostId;
			}
		}

		if(actionType==vrmUi.physicalResourceControllerValue("ACTION_TYPE_ON"))
		{
			if(isHost==true){
				$rootScope.powerCycleType = $filter('translate')('physicalresource.controller.POWER_CYCLETYPE_ON_HOST')+hostId;
			}else{
				$rootScope.powerCycleType = $filter('translate')('physicalresource.controller.POWER_CYCLETYPE_ON_SWITCH')+hostId;
			}
		}

		if(actionType==vrmUi.physicalResourceControllerValue("ACTION_TYPE_OFF"))
		{
			if(isHost==true){
				$rootScope.powerCycleType = $filter('translate')('physicalresource.controller.POWER_CYCLETYPE_OFF_HOST')+hostId;
			}else{
				$rootScope.powerCycleType = $filter('translate')('physicalresource.controller.POWER_CYCLETYPE_OFF_SWITCH')+hostId;
			}
		}

		$rootScope.hostManagementIsHost = isHost;
		$rootScope.hostManagementActionType = actionType;
		$rootScope.serviceRackId = hostId;

		$rootScope.modalInstance1 = $modal.open({
			templateUrl: vrmUi.physicalResourceControllerValue("CONFIRM_POWER_CYCLE"),
			size:vrmUi.physicalResourceControllerValue("SIZE"),
			backdrop: vrmUi.physicalResourceControllerValue("STATIC"),
			keyboard: false
		});
	};

	$scope.submitHostManagementDetail = function(){
		// show Loading Mask
		$rootScope.ShowFullScreenLoading = true;
		$rootScope.ShowFullScreenLoadingMsg = $filter('translate')('physicalresource.controller.SHOW_FULLSCREEN_LOADING_MSG');

		var isHost = $rootScope.hostManagementIsHost;
		var actionType = $rootScope.hostManagementActionType;
		var hostId = $rootScope.serviceRackId;
		var action = "";

		if(actionType==vrmUi.physicalResourceControllerValue("ACTION_TYPE_CYCLEHOST")){
			action = $filter('translate')('physicalresource.controller.ACTION_POWER_CYCLE');
		}

		if(actionType==vrmUi.physicalResourceControllerValue("ACTION_TYPE_ON")){
			action = $filter('translate')('physicalresource.controller.ACTION_POWER_ON');
		}

		if(actionType==vrmUi.physicalResourceControllerValue("ACTION_TYPE_OFF")){
			action = $filter('translate')('physicalresource.controller.ACTION_POWER_OFF');
		}
		$scope.clear();        
		PhysicalResourcesService.hostManagement($rootScope.uuid, hostId, actionType, isHost, function(data) {
			// show Loading Mask
			$rootScope.ShowFullScreenLoading = false;
			$rootScope.ShowFullScreenLoadingMsg = '';
			var json = null;
			var response = null;

			if(data.status == vrmUi.physicalResourceControllerValue("SUCCESS")){
				/*json = data.object.object;
				response = json.object;*/

				if($scope.thirdDivActive == true){
					$scope.shoWDiv("div3");
				}

				if($scope.thirdDivActive == false){
					$scope.shoWDiv("div2");
				}

				/*if(null!=json.object&& null!=response&& response.status==true){
					$rootScope.rackHostDetailSuccess = "Request for '"+action+"' on "+hostId+" has been sent successfully";
					$rootScope.rackHostsSuccess = "Request for '"+action+"' on "+hostId+" has been sent successfully";
				}else if(null!=json.object &&null!=response&& response.status==false){
					$rootScope.rackHostDetailError = response.responseMessage;
					$rootScope.rackHostsError = response.responseMessage;
				}else{
					$rootScope.rackHostDetailError = "VRM IP not found";
					$rootScope.rackHostsError = "VRM IP not found";
				}*/

				//fetch all hosts and switch again
				$scope.loadRackDetails($scope.selectedRack, $rootScope.uuid);

				if(undefined != $rootScope.hostDetail && null != $rootScope.hostDetail){
					//selectedHost, rackUUID, hostId
					$scope.loadHostDetails($scope.selectedHost, $rootScope.uuid, $rootScope.hostDetail.id);
				}

				$rootScope.rackHostDetailSuccess = data.message;
				$rootScope.rackHostsSuccess = data.message;
			} else {
				$rootScope.rackHostDetailError = data.message;
				$rootScope.rackHostsError = data.message;
			}
		}, function(data) {
			// Loading Mask
			$rootScope.ShowFullScreenLoading = false;
			$rootScope.ShowFullScreenLoadingMsg = '';

			$rootScope.rackHostDetailError = $filter('translate')('physicalresource.controller.FAILED_TO_PERFORN')+action+$filter('translate')('physicalresource.controller.CONTACT_MSG')+data.code;
			$rootScope.rackHostsError = $filter('translate')('physicalresource.controller.FAILED_TO_PERFORN')+action+$filter('translate')('physicalresource.controller.CONTACT_MSG')+data.code;
			//console.log(data);
		});

		$scope.cancelPopup();
	};

	//$scope.getRackList();
	$scope.hideAllDivs();

	$scope.shoWDiv('div1');
	$scope.shoWDiv('listview');
});