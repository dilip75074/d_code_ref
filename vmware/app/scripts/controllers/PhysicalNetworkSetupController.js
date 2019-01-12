vrmUI.controller('PhysicalNetworkSetupController', function($scope, $rootScope, $location, $route, PhysicalNetworkSetupService, $filter, NetworkConfigService, $translate) {
	console.log("PhysicalNetworkSetupController Loaded");

	// Get the page context object
	$rootScope.pageContextObject = angular.copy($route.current.data);
	// Translate heading
	var headerKey = $rootScope.pageContextObject.pageTitle;
	$rootScope.pageContextObject.pageTitle = "";
	$translate(headerKey)
        .then(function (translatedValue) {
            $rootScope.pageContextObject.pageTitle = translatedValue;
        });
	console.log("Page Context Object for physical-network-setup screen is: ");
	console.log($rootScope.pageContextObject);

	//used for ng-pattern validation
	$scope.range = /^([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$/;
	/*$scope.numeric = /^[0-9]+$/;*/
	$scope.part1Ip = /^(0{0,2}[1-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$/;
	$scope.vlanIdRegEx = /^([0]?[0-9]{1,3}|[1-3][0-9]{3}|40[0-8][0-9]|409[0-4])$/;
	$scope.isValidFlow = [];

	$scope.networkConfigAlreadyFilled = false;
	
	var networks = {
		'VMOTION' : {
			'modelName' : 'vMOTIONdata',
			'formName' : 'formvmotion',
			'tabNumber' : 1
		},
		'VSAN' : {
			'modelName' : 'vSANdata',
			'formName' : 'formvsan',
			'tabNumber' : 2
		},
		'VXLAN' : {
			'modelName' : 'vXLANdata',
			'formName' : 'formvxlan',
			'tabNumber' : 3
		},
		'EXTERNAL_CONNECTION' : {
			'modelName' : 'externalConnectionsdata',
			'formName' : 'formexternalconnections',
			'tabNumber' : 4
		}
	};

	var externalConType = $filter('translate')('physicalnetworksetup.controller.EXTERNAL_CON_TYPE');
	var allNetworkSetupsArray = [];
	var externalConnectionsArray = [];
	var currentPosition = 0;
	var networkSetupsObject = {};

	/*
	*	Helping Functions
	*/

	//reset all variables
	$scope.initPage = function(){
		allNetworkSetupsArray = [];
		externalConnectionsArray = [];
		currentPosition = 0;
	};

	//split ip address format data in parts to display in text fields
	$scope.convertIpToParts = function(networkObj){
		var tempObj = {};
		angular.forEach(networkObj, function(value, key){

			if(key != 'subnet' && key != 'subnetMask' && key != 'gateway' && key != 'dns' && key != 'ntp')
			{
				this[key] = value;
			}
			else
			{
				if(null != value)
				{				
					var splitArray = value.split(".");
					var tempIpObj = {};
					angular.forEach(splitArray, function(val, ind){
						tempIpObj['part'+(ind+1)] = splitArray[ind];
					}, tempIpObj);
					this[key] = tempIpObj;
				}
			}
		}, tempObj);
		return tempObj;
	};

	//save form data to json object 
	$scope.convertObjectToIp = function(data){
		var find = ',';
		var re = new RegExp(find, 'g');
		var tempObj = {};
		angular.forEach(data, function(value, key) {
			var tempVal = [];
			if(null != value && value.constructor == Object && Object.keys(value).length > 1){
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

	//dont allow white space in connection name
	$scope.$watch('externalConnectionsdata.networkName', function(newValue) {
		if(undefined != newValue)
		{
	       	$scope.externalConnectionsdata.networkName = newValue.replace(/\s+/g, '');
		}
    });

	/*
	*	Main Functionality
	*/
	
	//on load, fetch data
	$scope.fetchAllNetworkSetups = function(){
		$scope.initPage();
		PhysicalNetworkSetupService.fetchAllNetworkSetups(function(data){
			
			
			if(data.status == vrmUi.physicalNetworkSetupControllerVaue("SUCCESS"))
			{
				allNetworkSetupsArray = data.object;
				angular.forEach(allNetworkSetupsArray, function(network, index){
					if(network.networkType != "MGMT" && undefined != networks[network.networkType]) {
							$scope[networks[network.networkType].modelName] = $scope.convertIpToParts(network);
							networkSetupsObject[network.networkType] = angular.copy(network);
					}
				});
				$scope.networkSetupError = "";
			}
			else
			{
				$scope.networkSetupError = $filter('translate')('physicalnetworksetup.controller.NETWORK_SETUP_FETCH_ERROR');
			}
		}, function(data){
			$scope.phySetup = 5;
	        $scope.networkSetupError = $filter('translate')('physicalnetworksetup.controller.FETCH_NETWORK_SETUP_ERROR')+data.code;
		});
	};

	//on next button click, validate current form, add it to response object and go to next tab else show error
	$scope.validateTab = function(type){
		$scope.submitted = 0;
		$scope.showUpdateMessage = 0;
		
		$scope.isValidFlow.push(networks[type].tabNumber);
		
		if(type != externalConType)
		{
			if($scope[networks[type].formName].$valid)
			{	
				$rootScope[networks[type].modelName] = $scope[networks[type].modelName];
				networkSetupsObject[type] = $scope.convertObjectToIp($scope[networks[type].modelName]);
				$scope.phySetup = networks[type].tabNumber+1;
			}
			else
			{
				$scope.submitted = networks[type].tabNumber;
			}
		}
		else
		{
			if($scope[networks[externalConType].formName].$valid) { 
				$rootScope[networks[type].modelName] = $scope[networks[type].modelName];
				
				networkSetupsObject[type] = $scope.convertObjectToIp($scope[networks[type].modelName]);
				
				$scope.phySetup = 5;
				$scope.showValidNetworks();		
			} else {
				$scope.submitted = networks[type].tabNumber;
			}
		}
	};

	//on review click, show valid network setups
	$scope.showValidNetworks = function() {
		angular.forEach(networkSetupsObject, function(value, type) {
			
			$rootScope[type] = networkSetupsObject[type];
		});
	};

	//on connect button click, submit response
	$scope.submitAllNetworkSetups = function(){
		
		allNetworkSetupsArray = [];
		

		var flag = true;
		
		// check if all forms are valid and if user has changed data in any form, check if he has saved the changes by clicking on Next button.

		angular.forEach(networks, function(value, key){
			
			console.log(JSON.stringify($scope.convertObjectToIp($scope[value.modelName])));
			console.log(JSON.stringify(networkSetupsObject[key]));


			//stop the iteration over all tabs, when we find if form is invalid or is updated
			if(flag)
			{

				if($scope[networks[key].formName].$valid) {
					$scope.showUpdateMessage = 0;
					var updatedObj = $scope.convertObjectToIp($scope[value.modelName]);
					var json = {};
					angular.forEach(networkSetupsObject[key], function(val, prop) {
						if(!updatedObj.hasOwnProperty(prop)) {
							json[prop] = null;
						} else {
							json[prop] = updatedObj[prop];
						}
					});
	
					//if form is valid , compare backup object and updated object, if not same, it means changes need to be saved, so show that tab
					if(!angular.equals(networkSetupsObject[key], json))
					{
						flag = false;
						$scope.phySetup = value.tabNumber;
						$scope.showUpdateMessage = value.tabNumber;
					}
				} else {
					//if form is not valid, show that form, force user to fill all fields correctly.
					flag = false;
					$scope.phySetup = value.tabNumber;
					$scope.submitted = value.tabNumber;
				}				
			}
		});
		
		//if user has saved all changes made, then proceed to send API call.
		if(flag) {
			angular.forEach(networkSetupsObject, function(value, key){
				value.networkType = key;
				allNetworkSetupsArray.push(value);
			});

			currentPosition = 0;
			externalConnectionsArray = [];
			networkSetupsObject = {};
				
			PhysicalNetworkSetupService.submitAllNetworkSetups(allNetworkSetupsArray, function(data){
	           if (data.status == vrmUi.physicalNetworkSetupControllerVaue("SUCCESS")) {
	            	$scope.fetchAllNetworkSetups();
	            	$scope.networkSetupError = "";
	            	$scope.saveSuccess = true;
	            	$location.url(vrmUi.physicalNetworkSetupControllerVaue("IP_REALLOCATION"));
	            } else {
	            	// Show the error message from the server in case the error id is VRM040204E (overlap check)
	            	if(data.code == "VRM040204E") {
	            		$scope.saveSuccess = false;
	            		$scope.networkSetupError = "Overlap in network: "+data.object["networkType"]+$filter('translate')('physicalnetworksetup.controller.PLEASE_ENTER_SUBNET');
	            	} else {
	            		$scope.saveSuccess = false;
	            		$scope.networkSetupError = $filter('translate')('physicalnetworksetup.controller.NODATA_SAVING_ERROR');
	            	}
	            }
	        }, function(data) {
	        	$scope.saveSuccess = false;
	        	$scope.networkSetupError = $filter('translate')('physicalnetworksetup.controller.SAVING_NETWORK_SETUP_ERROR')+data.code;	
	        });
		}
	};
	
	$scope.back = function(){
		$rootScope.isBackFormPhysicalResourcePage = true;
		$location.url(vrmUi.physicalNetworkSetupControllerVaue("NETWORK_CONFIG"));
	};

	$scope.proceedIfNetworkConfigFilled = function() {
		NetworkConfigService.fetchNetworkPropForPhysicalNetworkSetup(function(isFilled) {
			if(isFilled)
			{
				$scope.networkConfigAlreadyFilled = true;
				$scope.fetchAllNetworkSetups();
			}
			else
			{
				$location.url(vrmUi.physicalNetworkSetupControllerVaue("NETWORK_CONFIG"));
			}
	    }, function(data) {
	    	$location.url(vrmUi.physicalNetworkSetupControllerVaue("NETWORK_CONFIG"));
	    });
	};
});