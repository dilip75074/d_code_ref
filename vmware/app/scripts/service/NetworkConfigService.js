/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

 vrmUI.service('NetworkConfigService', function(HttpCommunicationUtil, PropertyService, $filter,  $rootScope) {
	// Define the object for network Config
	var networkConfigdata = {};
	
	// Define the object for vRack Config
	var vrackConfigdata = {};

	
	fetchVrackPropForPhysicalNetworkSetup = function(successCallback, errorCallback) {
		//getting the values for Management vrack config from properties table
		 PropertyService.fetchProperties(function(data) {
			console.log("data.length :: ");
			console.log(JSON.stringify(data));
			// Loop through the property array
			var numberOfFields = 4;
			if(data.status == $filter('translate')('networkconfig.service.SUCCESS')) {
				if(undefined != data.object && data.object != null && data.object.length > 0)
				{
					var count = 0;
					angular.forEach(data.object, function(propertyObj, ind) {
						if(count<numberOfFields && (propertyObj[$filter('translate')('networkconfig.service.NAME')] == $filter('translate')('networkconfig.service.VRACK_NAME') ||
						propertyObj[$filter('translate')('networkconfig.service.NAME')] == $filter('translate')('networkconfig.service.COMPANY_NAME') ||
						propertyObj[$filter('translate')('networkconfig.service.NAME')] == $filter('translate')('networkconfig.service.COMPANY_DEPARTMENT') ||
						propertyObj['name'] == 'pscDomainName'))
						{
							count++;
						}
					});
					if(count == numberOfFields)
					{
						successCallback(true);
					}
					else
					{
						successCallback(false);
					}
				}
				else
				{
					successCallback(false);
				}
			}
		}, errorCallback);
	};
	 
	this.fetchNetworkPropForPhysicalNetworkSetup = function(successCallback, errorCallback) {
		 	
		//getting the values from prm/networks for Management n/w config from physical_network table
		HttpCommunicationUtil.doGet(vrmUi.getValue("configAPI"), function(data){
		console.log("data.length :: ");
		console.log(JSON.stringify(data));
		 
			if(undefined != data.object && null != data.object && data.object.length > 0) { 
				fetchVrackPropForPhysicalNetworkSetup(successCallback, errorCallback);
		 	}
		 	else
		 	{
		 		successCallback(false);
		 	}
		}, function(){
		
		});
	};
	
	 
	 this.fetchNetworkConfigProperties = function(successCallback, errorCallback) {
		 	
		 //getting the values from prm/networks for Management n/w config from physical_network table
		 HttpCommunicationUtil.doGet(vrmUi.getValue("configAPI"), function(data){
			 console.log("data.length :: ");
			 console.log(JSON.stringify(data));
			 
			 if(undefined != data.object) {
				 var configurations = data.object;
				 for(var i=0 ; i<configurations.length ; i++) {
					 if(configurations[i].networkType == "MGMT") {
						 
						 //console.log("==================================================================");
						 //console.log(JSON.stringify(configurations[i]));
						 
						 $rootScope.magmtData = configurations[i];
						 
						 angular.forEach(configurations[i], function(value, key) {
							 // subnet
							if(key == $filter('translate')('networkconfig.service.SUBNET')) {
								var subnet = value;
								var subnetSplitArray = subnet.split(".");
								networkConfigdata["subnet"] = {};
								for(var i = 1 ; i <= subnetSplitArray.length ; i++) {
									networkConfigdata["subnet"]["part"+i] = subnetSplitArray[i - 1];
								}
							}
							 
							// Subnet Mask
							if(key == $filter('translate')('networkconfig.service.SUBNET_MASK')) {
								var subnetMask = value;
								var subnetMaskSplitArray = subnetMask.split(".");
								networkConfigdata["subnetMask"] = {};
								for(var i = 1 ; i <= subnetMaskSplitArray.length ; i++) {
									networkConfigdata["subnetMask"]["part"+i] = subnetMaskSplitArray[i - 1];
								}
							}
							
							// Gateway
							if(key == $filter('translate')('networkconfig.service.GATEWAY')) {
								var gateway = value;
								var gatewaySplitArray = gateway.split(".");
								networkConfigdata["gateway"] = {};
								for(var i = 1 ; i <= gatewaySplitArray.length ; i++) {
									networkConfigdata["gateway"]["part"+i] = gatewaySplitArray[i - 1];
								}
							}
							
							// VLAN ID
							if(key == $filter('translate')('networkconfig.service.VLAN_ID')) {
								networkConfigdata["vlanId"] = value;
							}
							
							// DNS
							if(key == $filter('translate')('networkconfig.service.DNS')) {
								networkConfigdata["dns"] = value;
							}
							
							// NTP
							if(key == $filter('translate')('networkconfig.service.NTP')) {
								networkConfigdata["ntp"] = value;
							} 
							
							if(key == $filter('translate')('networkconfig.service.ID')) {
								networkConfigdata["id"] = value;
							}

						 });
					 }
				 }
			 }
			 fetchVrackProperties(successCallback, errorCallback);
		 }, function(){
		 });

	 };
	 
	 fetchVrackProperties = function(successCallback, errorCallback) {
		 	
		 //getting the values for Management vrack config from properties table
		 PropertyService.fetchProperties(function(data) {
			console.log("Inside success for properties service for fetching all properties");
			
			// Loop through the property array
			if(data.status == $filter('translate')('networkconfig.service.SUCCESS')) {
				angular.forEach(data.object, function(value, key) {
					// vRack Config Data
					// vRack Name
					if(value[$filter('translate')('networkconfig.service.NAME')] == $filter('translate')('networkconfig.service.VRACK_NAME')) {
						vrackConfigdata["vrackName"] = value['value'];
					}
					// Company Name
					if(value[$filter('translate')('networkconfig.service.NAME')] == $filter('translate')('networkconfig.service.COMPANY_NAME')) {
						vrackConfigdata["companyName"] = value['value'];
					}
					// Company Department
					if(value[$filter('translate')('networkconfig.service.NAME')] == $filter('translate')('networkconfig.service.COMPANY_DEPARTMENT')) {
						vrackConfigdata["companyDepartment"] = value['value'];
					}

					if(value["name"] == "pscDomainName") {
						vrackConfigdata["pscDomainName"] = value['value'];
					}
				});
				
				successCallback(vrackConfigdata, networkConfigdata);
			}
			
			/*var networkConfigConsolidatedData = {"vrackConfigdata": vrackConfigdata, "networkConfigdata": networkConfigdata};
			successCallback(networkConfigConsolidatedData);*/
		}, errorCallback);
	 };
	 
	 
	 /**
	  * Method to save the vRack Configuration data
	  * 
	  */
	this.vrackConfig = function(data, successCallback, errorCallback) {
		console.log("in vrackConfig");
		var properties = [];
		angular.forEach(data, function(value, key) {
			this.push({name:key, value:value});
		}, properties);

		HttpCommunicationUtil.doPut(vrmUi.getValue("vrackConfigAPI"), properties, successCallback, errorCallback);
	};

	/**
	 * Method to save the network configuration data
	 */
 	this.networkConfig = function(data, successCallback, errorCallback) {
 		console.log("in NetworkConfigService");
 		
 		var magmtData = {};
        var find = ',';
        var re = new RegExp(find, 'g');

        angular.forEach(data, function(value, key) {
        	var tempVal = [];
        	if(value.constructor == Object && Object.keys(value).length > 1){
				
        		angular.forEach(value, function(val, k) {
					tempVal.push(val);
				});
				
				if(key == 'subnetMask') {
					magmtData.subnetMask = tempVal.toString().replace(re, ".");
				} else if(key == 'subnet') {
					magmtData.subnet = tempVal.toString().replace(re, ".");
				} else {
					magmtData[key] = tempVal.toString().replace(re, ".");
				}
			} else {
				magmtData[key] = value;
			}
        });
        magmtData.networkType = "MGMT";
        
	  	var properties = [];
	  	properties.push(magmtData);
	  	
	  	$rootScope.magmtData = magmtData;
	  	HttpCommunicationUtil.doPost(vrmUi.getValue("configAPI"), properties, successCallback, errorCallback);
 	};
 });