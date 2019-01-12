/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/
 
vrmUI.controller('WorkloadConfigurationController', function($scope, $rootScope, $location, $route, $modal, VDIWorkloadConfigurationService, $timeout, $filter, PhysicalNetworkSetupService) {
	console.log('Workload Configuration Controller Loaded');
	
	// Variable for screen navigation
	$scope.workloadScreenShow = "general"; //(general, security, system-config, review)
	
	// Error message variable
	$scope.workloadConfigurationErrorMessage = "";
	
	// Initialize general config
	$scope.generalConfig = new Object();
	$scope.securityConfig = new Object();
	$scope.systemConfig = new Object();
	$scope.viewServers = new Object();
	$scope.workloadId = "";
	
	// File Upload Statuses (ISO and OVA)
	$scope.isoFileUploadComplete = false;
	$scope.ovaFileUploadComplete = false;
	
	// File Upload Progress Statuses (ISO and OVA)
	$scope.isoFileUploadProgress = false;
	$scope.ovaFileUploadProgress = false;
	
	// File Error Statuses (ISO and OVA)
	$rootScope.isoFileUploadError = false;
	$rootScope.ovaFileUploadError = false;
	
	// Percentage for existing values
	$rootScope.existingISOPresent = 0;
	$rootScope.existingOVAPresent = 0;
	
	$scope.isoFileSelected = false;
	$scope.ovaFileSelected = false;
	
	// Progress Messages
	$scope.progressMessages = new Array();
	$scope.progressStatus = "";
	
	// IPAM Full Error
	$scope.securityServersIPAMError = "";
	$scope.composerServersIPAMError = "";
	$scope.connectionServersIPAMError = "";
	
	// Validations
	$scope.range = /^([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$/;
    $scope.numeric = /^[0-9]+$/;
    $scope.vlanIdRegEx = /^([0]?[0-9]{1,3}|[1-3][0-9]{3}|40[0-8][0-9]|409[0-4])$/;
    $scope.part1Ip = /^(0{0,2}[1-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$/;
    
    // Clear the submitted fields too
	$scope.submitted = 0;
	
	// Workload in progress
	$scope.workloadTriggerDisabled = false;
	
	// Mgmt and External Default values
	$scope.mgmtDefaultValues = new Object();
	$scope.externalDefaultValues = new Object();
		
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
	
	$scope.ovaFileAdded = function() {
		$scope.ovaFileSelected = true;
		console.log("OVA File added");
		$scope.ovaFileUploadComplete = false;
		$rootScope.existingOVAPresent = 0;
		$rootScope.ovaFileUploadError = false;
	};
	
	$scope.ovaFileComplete = function() {
		console.log("OVA File complete");
		$scope.ovaFileUploadComplete = true;
		$scope.ovaFileUploadProgress = false;
		$rootScope.existingOVAPresent = 0;
		$rootScope.ovaFileUploadError = false;
	};
	
	$scope.ovaFileProgress = function(flowObj) {
		$rootScope.ovaProgressValue = flowObj.progress();
		
		$scope.ovaFileUploadProgress = true;
		$rootScope.existingOVAPresent = 0;
		$rootScope.ovaFileUploadError = false;
	};
	
	$scope.ovaFileError = function(flowObj) {
		$scope.ovaFileUploadProgress = false;
		$scope.ovaFileUploadComplete = false;
		$rootScope.ovaFileUploadError = true;
	};
	
	$scope.uploadComplete = function() {
		if(($rootScope.isoProgressValue == 1 && $rootScope.ovaProgressValue == 1) || ($rootScope.isoProgressValue == 1 && $rootScope.ovaProgressValue == undefined) || ($rootScope.isoProgressValue == undefined && $rootScope.ovaProgressValue == 1))
		{
			return true;
		}
		return false;
	};
	
	// Loading Mask
	$rootScope.ShowFullScreenLoading = false;
	$rootScope.ShowFullScreenLoadingMsg = '';
	
	$scope.createNewWorkloadConfiguration = function() {
		
		$scope.submitted = 0;
		
		// Show Loading panel
		$rootScope.ShowFullScreenLoading = true;
		$rootScope.ShowFullScreenLoadingMsg = $filter('translate')('workloadconfiguration.controller.CREATING_WORKLOAD_CONFIG_LOADING_MSG');
		
		// Call to create a new workload configuration
		
		VDIWorkloadConfigurationService.createNewWorkloadConfiguration(function(data, status) {
			console.log("Workload configuration created: ");
			console.log(data);
			
			$rootScope.ShowFullScreenLoading = false;
			$rootScope.ShowFullScreenLoadingMsg = '';
			
			if(data.status == vrmUi.getWorkloadConfigurationValue("SUCCESS")) {
				$scope.workloadId = data.object;
				$rootScope.rootScopeWorkloadId = $scope.workloadId;
				// Call to fetch the configuration for workloadId
				$scope.fetchExistingVDIConfiguration();
			}
			
		}, function(data, status) {
			$rootScope.ShowFullScreenLoading = false;
			$rootScope.ShowFullScreenLoadingMsg = '';
			// TODO: Show error
			
		});
	};
	
	$scope.fetchExistingVDIConfiguration = function() {
		$scope.submitted = 0;
		
		// Show Loading panel
		$rootScope.ShowFullScreenLoading = true;
		$rootScope.ShowFullScreenLoadingMsg = $filter('translate')('workloadconfiguration.controller.FETCHING_WORKLOAD_CONFIG_LOADING_MSG');
		
		// Call to fetch workload configuration
		VDIWorkloadConfigurationService.fetchVDIWorkloadConfiguration($scope.workloadId, function(data, status) {
			console.log("Fetched the workload configuration: ");
			console.log(data);
			
			$rootScope.ShowFullScreenLoading = false;
			$rootScope.ShowFullScreenLoadingMsg = '';
			
			if(data.status == vrmUi.getWorkloadConfigurationValue("SUCCESS")) {
				$scope.setScopeVariablesForUI(data);
			}
			
		}, function(data, status) {
			$rootScope.ShowFullScreenLoading = false;
			$rootScope.ShowFullScreenLoadingMsg = '';
			// TODO: Show error
			
		});
	};
	
	/**
	 * Enabling or disabling the external network configuration form input based on the user selection of using existing or choosing new
	 * 
	 */
	$scope.enableDisableNetworkConfiguration = function(networkType, useExisting) {
		console.log("Enabling disabling the netowrk configuration for network type: "+networkType+" and use existing: "+useExisting);
		if(useExisting) {
			// Disable all the entries from the form
			if(networkType == "MGMT") {
				// Reset the Mgmt Form
				$scope.disableMgmtNetworkConfiguration = true;
				console.log("Resetting the MGMT network to the default values: ");
				console.log($scope.mgmtDefaultValues);
				$scope.networkConfig["mgmt"] = $scope.mgmtDefaultValues;
				$scope.networkConfig["mgmt"]["useExistingNetwork"] = true;
			} else if(networkType == "EXTERNAL") {
				// Reset the External Form
				$scope.disableExternalNetworkConfiguration = true;
				$scope.networkConfig["external"] = $scope.externalDefaultValues;
				$scope.networkConfig["external"]["useExistingNetwork"] = true;
			}
		} else {
			// Enable all the entries from the form
			if(networkType == "MGMT") {
				$scope.disableMgmtNetworkConfiguration = false;
				// Clear the MGMT form
				$scope.networkConfig["mgmt"] = new Object();
				$scope.networkConfig["mgmt"]["useExistingNetwork"] = false;
			} else if(networkType == "EXTERNAL") {
				$scope.disableExternalNetworkConfiguration = false;
				// Clear the EXTERNAL form
				$scope.networkConfig["external"] = new Object();
				$scope.networkConfig["external"]["useExistingNetwork"] = false;
			}
		}
	};
	
	/**
	 * Method to reset the external form to default values
	 * 
	 */
	$scope.resetExternalFormToDefaultValues = function() {
		
	};
	
	/**
	 * Setting the scope variables for the network configuration for the UI
	 * 
	 */
	$scope.setNetworkConfigurationForUI = function(data) {
		
		// Network Configuration
		$scope.networkConfig = new Object();
		
		// Mgmt Network
		$scope.networkConfig["mgmt"] = new Object();
		if(data["mgmtNetwork"] != null) {
			var mgmtNetwork = data["mgmtNetwork"];
			$scope.networkConfig["mgmt"]["subnetName"] = mgmtNetwork["subnetName"];
			$scope.networkConfig["mgmt"]["vlanId"] = mgmtNetwork["vlanId"];
			$scope.networkConfig["mgmt"]["useExistingNetwork"] = mgmtNetwork["useExistingNetwork"];
			if($scope.networkConfig["mgmt"]["useExistingNetwork"]) {
				$scope.disableMgmtNetworkConfiguration = true;
			} else {
				$scope.disableMgmtNetworkConfiguration = false;
			}
			// Subnet
			$scope.networkConfig["mgmt"]["subnet"] = mgmtNetwork["subnet"];
			if(mgmtNetwork["subnet"] != null) {
				var subnetSplit = mgmtNetwork["subnet"].split(".");
				$scope.networkConfig["mgmt"]["subnet"] = new Object();
				$scope.networkConfig["mgmt"]["subnet"]["part1"] = subnetSplit[0];$scope.networkConfig["mgmt"]["subnet"]["part2"] = subnetSplit[1];$scope.networkConfig["mgmt"]["subnet"]["part3"] = subnetSplit[2];$scope.networkConfig["mgmt"]["subnet"]["part4"] = subnetSplit[3];
			}
			// Subnet Mask
			$scope.networkConfig["mgmt"]["subnetMask"] = mgmtNetwork["subnetMask"];
			if(mgmtNetwork["subnetMask"] != null) {
				var subnetMaskSplit = mgmtNetwork["subnetMask"].split(".");
				$scope.networkConfig["mgmt"]["subnetMask"] = new Object();
				$scope.networkConfig["mgmt"]["subnetMask"]["part1"] = subnetMaskSplit[0];$scope.networkConfig["mgmt"]["subnetMask"]["part2"] = subnetMaskSplit[1];$scope.networkConfig["mgmt"]["subnetMask"]["part3"] = subnetMaskSplit[2];$scope.networkConfig["mgmt"]["subnetMask"]["part4"] = subnetMaskSplit[3];
			}
			// Gateway
			$scope.networkConfig["mgmt"]["gateway"] = mgmtNetwork["gateway"];
			if(mgmtNetwork["gateway"] != null) {
				var gatewaySplit = mgmtNetwork["gateway"].split(".");
				$scope.networkConfig["mgmt"]["gateway"] = new Object();
				$scope.networkConfig["mgmt"]["gateway"]["part1"] = gatewaySplit[0];$scope.networkConfig["mgmt"]["gateway"]["part2"] = gatewaySplit[1];$scope.networkConfig["mgmt"]["gateway"]["part3"] = gatewaySplit[2];$scope.networkConfig["mgmt"]["gateway"]["part4"] = gatewaySplit[3];
			}
			// Set the default mgmt network object
			$scope.mgmtDefaultValues = JSON.parse(JSON.stringify($scope.networkConfig["mgmt"]));
		} else {
			$scope.networkConfig["mgmt"]["useExistingNetwork"] = false;
		}
		
		// External Network
		$scope.networkConfig["external"] = new Object();
		if(data["externalNetwork"] != null) {
			var externalNetwork = data["externalNetwork"];
			$scope.networkConfig["external"]["subnetName"] = externalNetwork["subnetName"];
			$scope.networkConfig["external"]["vlanId"] = externalNetwork["vlanId"];
			$scope.networkConfig["external"]["useExistingNetwork"] = externalNetwork["useExistingNetwork"];
			if($scope.networkConfig["external"]["useExistingNetwork"]) {
				$scope.disableExternalNetworkConfiguration = true;
			} else {
				$scope.disableExternalNetworkConfiguration = false;
			}
			// Subnet
			$scope.networkConfig["external"]["subnet"] = externalNetwork["external"];
			if(externalNetwork["subnet"] != null) {
				var subnetSplit = externalNetwork["subnet"].split(".");
				$scope.networkConfig["external"]["subnet"] = new Object();
				$scope.networkConfig["external"]["subnet"]["part1"] = subnetSplit[0];$scope.networkConfig["external"]["subnet"]["part2"] = subnetSplit[1];$scope.networkConfig["external"]["subnet"]["part3"] = subnetSplit[2];$scope.networkConfig["external"]["subnet"]["part4"] = subnetSplit[3];
			}
			// Subnet Mask
			$scope.networkConfig["external"]["subnetMask"] = externalNetwork["subnetMask"];
			if(externalNetwork["subnetMask"] != null) {
				var subnetMaskSplit = externalNetwork["subnetMask"].split(".");
				$scope.networkConfig["external"]["subnetMask"] = new Object();
				$scope.networkConfig["external"]["subnetMask"]["part1"] = subnetMaskSplit[0];$scope.networkConfig["external"]["subnetMask"]["part2"] = subnetMaskSplit[1];$scope.networkConfig["external"]["subnetMask"]["part3"] = subnetMaskSplit[2];$scope.networkConfig["external"]["subnetMask"]["part4"] = subnetMaskSplit[3];
			}
			// Gateway
			$scope.networkConfig["external"]["gateway"] = externalNetwork["gateway"];
			if(externalNetwork["gateway"] != null) {
				var gatewaySplit = externalNetwork["gateway"].split(".");
				$scope.networkConfig["external"]["gateway"] = new Object();
				$scope.networkConfig["external"]["gateway"]["part1"] = gatewaySplit[0];$scope.networkConfig["external"]["gateway"]["part2"] = gatewaySplit[1];$scope.networkConfig["external"]["gateway"]["part3"] = gatewaySplit[2];$scope.networkConfig["external"]["gateway"]["part4"] = gatewaySplit[3];
			}
			// Set the default external network object
			$scope.externalDefaultValues = $scope.networkConfig["external"];
			// Set the scope variable such that the view knows that it needs to disable existing option
			$scope.disableExistingExternalOption = false;
			// Set the default mgmt network object
			$scope.externalDefaultValues = JSON.parse(JSON.stringify($scope.networkConfig["external"]));
		} else {
			$scope.networkConfig["external"]["useExistingNetwork"] = false;
			$scope.disableExistingExternalOption = true;
		}
		
		// DMZ Network
		$scope.networkConfig["dmz"] = new Object();
		if(data["dmzNetwork"] != null) {
			var dmzNetwork = data["dmzNetwork"];
			$scope.networkConfig["dmz"]["subnetName"] = dmzNetwork["subnetName"];
			$scope.networkConfig["dmz"]["vlanId"] = dmzNetwork["vlanId"];
			// Subnet
			$scope.networkConfig["dmz"]["subnet"] = dmzNetwork["external"];
			if(dmzNetwork["subnet"] != null) {
				var subnetSplit = dmzNetwork["subnet"].split(".");
				$scope.networkConfig["dmz"]["subnet"] = new Array(3);
				$scope.networkConfig["dmz"]["subnet"]["part1"] = subnetSplit[0];$scope.networkConfig["dmz"]["subnet"]["part2"] = subnetSplit[1];$scope.networkConfig["dmz"]["subnet"]["part3"] = subnetSplit[2];$scope.networkConfig["dmz"]["subnet"]["part4"] = subnetSplit[3];
			}
			// Subnet Mask
			$scope.networkConfig["dmz"]["subnetMask"] = dmzNetwork["subnetMask"];
			if(dmzNetwork["subnetMask"] != null) {
				var subnetMaskSplit = dmzNetwork["subnetMask"].split(".");
				$scope.networkConfig["dmz"]["subnetMask"] = new Array(3);
				$scope.networkConfig["dmz"]["subnetMask"]["part1"] = subnetMaskSplit[0];$scope.networkConfig["dmz"]["subnetMask"]["part2"] = subnetMaskSplit[1];$scope.networkConfig["dmz"]["subnetMask"]["part3"] = subnetMaskSplit[2];$scope.networkConfig["dmz"]["subnetMask"]["part4"] = subnetMaskSplit[3];
			}
			// Gateway
			$scope.networkConfig["dmz"]["gateway"] = dmzNetwork["dmz"];
			if(dmzNetwork["gateway"] != null) {
				var gatewaySplit = dmzNetwork["gateway"].split(".");
				$scope.networkConfig["dmz"]["gateway"] = new Array(3);
				$scope.networkConfig["dmz"]["gateway"]["part1"] = gatewaySplit[0];$scope.networkConfig["dmz"]["gateway"]["part2"] = gatewaySplit[1];$scope.networkConfig["dmz"]["gateway"]["part3"] = gatewaySplit[2];$scope.networkConfig["dmz"]["gateway"]["part4"] = gatewaySplit[3];
			}
		}
		
	};
	
	
	/**
	 * Method to set the scope variables based on the data fetched from the server
	 * 
	 */
	$scope.setScopeVariablesForUI = function(data) {
		
		// Set the workload ID
		if(data.object.workloadId == null || data.object.workloadId == undefined) {
			console.log("Workload ID not yet created");
		} else {
			console.log("Workload ID created .. assign it to the scope variable");
			$scope.workloadId = data.object.workloadId;
			$rootScope.rootScopeWorkloadId = $scope.workloadId;
		}
		
		// Basic / General
		if(data.object.basicVDIConfiguration == null || data.object.basicVDIConfiguration == undefined) {
			console.log("No basic VDI Workload configuration fetched from the server");
			$scope.generalConfig = new Object();
			$scope.workloadId = "";
			$rootScope.rootScopeWorkloadId = $scope.workloadId;
			$scope.generalConfig["numberOfVDI"] = 1;
			$scope.generalConfig["cpu"] = 1;
			$scope.generalConfig["ram"] = 1;
			$scope.generalConfig["storage"] = 0;
		} else {
			console.log("Basic VDI Workload configuration fetched from the server .. so assign it to the scope object: ");
			console.log(data.object.basicVDIConfiguration);
			var basicVDIConfiguration = data.object.basicVDIConfiguration;
			$scope.generalConfig["workloadName"] = basicVDIConfiguration.workloadName;
			if($scope.generalConfig["workloadName"] == null) {
				$scope.generalConfig["workloadName"] = "";
			}
			$scope.generalConfig["persistence"] = basicVDIConfiguration.persistence;
			if($scope.generalConfig["persistence"] == null || $scope.generalConfig["persistence"] == "") {
				$scope.generalConfig["persistence"] = vrmUi.getWorkloadConfigurationValue("LINKED");
			}
			$scope.generalConfig["connectVDI"] = basicVDIConfiguration.connectFromEverywhere;
			$scope.generalConfig["reserveResourcesOnly"] = basicVDIConfiguration.reserveResourcesOnly;
			if(basicVDIConfiguration.numberOfVDIs == 0) {
				$scope.generalConfig["numberOfVDI"] = 1;
			} else {
				$scope.generalConfig["numberOfVDI"] = basicVDIConfiguration.numberOfVDIs;
			}
			if(basicVDIConfiguration.cpusPerVDI == 0) {
				$scope.generalConfig["cpu"] = 1;
			} else {
				$scope.generalConfig["cpu"] = basicVDIConfiguration.cpusPerVDI;
			}
			if(basicVDIConfiguration.ramPerVDI == 0) {
				$scope.generalConfig["ram"] = 1;
			} else {
				$scope.generalConfig["ram"] = basicVDIConfiguration.ramPerVDI;
			}
			
			$scope.generalConfig["storage"] = basicVDIConfiguration.storagePerVDI;
		}
		
		// Security
		if(data.object.vdiworkloadSecurityConfiguration == null || data.object.vdiworkloadSecurityConfiguration == undefined) {
			console.log("No security VDI Workload configuration fetched from the server");
			$scope.securityConfig = new Object();
		} else {
			console.log("Securoty VDI Workload configuration fetched from the server .. so assign it to the scope object: ");
			console.log(data.object.vdiworkloadSecurityConfiguration);
			var vdiworkloadSecurityConfiguration = data.object.vdiworkloadSecurityConfiguration;
			$scope.securityConfig["adminPassword"] = vdiworkloadSecurityConfiguration.systemAdministratorPassword;
			$scope.securityConfig["adminConfirmPassword"] = vdiworkloadSecurityConfiguration.systemAdministratorPassword;
			if(vdiworkloadSecurityConfiguration.dnsServerIp == null || vdiworkloadSecurityConfiguration.dnsServerIp == undefined) {
				
			} else {
				var dnsIpSplit = vdiworkloadSecurityConfiguration.dnsServerIp.split(".");
				$scope.securityConfig["dnsIP"] = new Array(3);
				$scope.securityConfig["dnsIP"]["part1"] = dnsIpSplit[0];
				$scope.securityConfig["dnsIP"]["part2"] = dnsIpSplit[1];
				$scope.securityConfig["dnsIP"]["part3"] = dnsIpSplit[2];
				$scope.securityConfig["dnsIP"]["part4"] = dnsIpSplit[3];
			}
			$scope.securityConfig["viewServersOu"] = vdiworkloadSecurityConfiguration.viewServersOu;
			$scope.securityConfig["checkTrustAD"] = vdiworkloadSecurityConfiguration.trustExistingActiveDirectory;
			$scope.securityConfig["trustInput"] = vdiworkloadSecurityConfiguration.existingActiveDirectory;
			
		}
		
		// System config
		if(data.object.vdiworkloadSystemConfiguration == null || data.object.vdiworkloadSystemConfiguration == undefined) {
			console.log("No system VDI Workload configuration fetched from the server");
			$scope.systemConfig = new Object();
		} else {
			console.log("System VDI Workload configuration fetched from the server .. so assign it to the scope object: ");
			console.log(data.object.vdiworkloadSystemConfiguration);
			var vdiworkloadSystemConfiguration = data.object.vdiworkloadSystemConfiguration;
			$scope.systemConfig["isoFileName"] = vdiworkloadSystemConfiguration.windowsIsoFile;
			if($scope.systemConfig["isoFileName"] != null && $scope.systemConfig["isoFileName"] != undefined && $scope.systemConfig["isoFileName"] != "") {
				$scope.isoFileUploadComplete = true;
				$rootScope.existingISOPresent = 100;
			}
			$scope.systemConfig["ovaFileName"] = vdiworkloadSystemConfiguration.ovaFile;
			if($scope.systemConfig["ovaFileName"] != null && $scope.systemConfig["ovaFileName"] != undefined && $scope.systemConfig["ovaFileName"] != "") {
				$scope.ovaFileUploadComplete = true;
				$rootScope.existingOVAPresent = 100;
			}
			$scope.systemConfig["licenseKey"] = vdiworkloadSystemConfiguration.windowsLicenseKey;
		}
		
		// View Servers
		if(data.object.viewServers == null || data.object.viewServers == undefined) {
			console.log("No view servers data fetched from the server");
			$scope.viewServers = new Object();
		} else {
			console.log("View Servers fetched from the server .. so assign it to the scope object: ");
			console.log(data.object.viewServers);
			var viewServers = data.object.viewServers;
			$scope.viewServers["securityServers"] = viewServers.securityServers;
			$scope.viewServers["securityServerList"] = viewServers.securityServerList;
			if(viewServers.securityServers != $scope.fetchSizeMap(viewServers.securityServerList)) {
				$scope.securityServersIPAMError = $filter('translate')('workloadconfiguration.controller.SECURITY_SERVERIP_ERROR');
			}
			
			$scope.viewServers["connectionServers"] = viewServers.connectionServers;
			$scope.viewServers["connectionServerList"] = viewServers.connectionServerList;
			if(viewServers.connectionServers != $scope.fetchSizeMap(viewServers.connectionServerList)) {
				$scope.connectionServersIPAMError = $filter('translate')('workloadconfiguration.controller.CONNECTION_SERVERIP_ERROR');
			}
			
			$scope.viewServers["vCenterServers"] = viewServers.vCenterServers;
			$scope.viewServers["vCenterServerList"] = viewServers.vCenterServerList;
			$scope.viewServers["initialVcenter"] = viewServers.initialVcenter;
			if(viewServers.vCenterServers != $scope.fetchSizeMap(viewServers.vCenterServerList)) {
				$scope.vCenterServersIPAMError = $filter('translate')('workloadconfiguration.controller.VCENTER_SERVERIP_ERROR');
			}
			
			$scope.viewServers["composerServers"] = viewServers.composerServers;
			$scope.viewServers["composerServerList"] = viewServers.composerServerList;
			if(viewServers.composerServers != $scope.fetchSizeMap(viewServers.composerServerList)) {
				$scope.composerServersIPAMError = $filter('translate')('workloadconfiguration.controller.COMPOSER_SERVERIP_ERROR');
			}
			
			$scope.viewServers["domainControllerServers"] = viewServers.domainControllerServers;
			$scope.viewServers["domainControllerServerList"] = viewServers.domainControllerServerList;
		}
		
		// Network Config
		if(data.object.vdiworkloadNetworkConfiguration == null || data.object.vdiworkloadNetworkConfiguration == undefined) {
			console.log("No network VDI Workload configuration fetched from the server");
			$scope.networkConfig = new Object();
		} else {
			console.log("Network VDI Workload configuration fetched from the server .. so assign it to the scope object: ");
			console.log(data.object.vdiworkloadNetworkConfiguration);
			$scope.setNetworkConfigurationForUI(data.object.vdiworkloadNetworkConfiguration);
		}
	};
	
	$scope.fetchSizeMap = function(obj) {
		var size = 0, key;
	    for (key in obj) {
	        if (obj.hasOwnProperty(key)) size++;
	    }
	    return size;
	};
	
	$scope.validateNetworkDetails = function(networkType, data, connectFromEverywhere) {
		console.log("Validating the network details for networkType: "+networkType+" and data: ");
		console.log(data);
		
		$scope.workloadConfigurationErrorMessage = "";
		
		// Validate the form based on the networkType (formExternalNetworkConfiguration, formMgmtNetworkConfiguration, formDMZNetworkConfiguration)
		if(networkType == "EXTERNAL") {
			// Do not validate if Use Existing Network option is selected
			if(!$scope.networkConfig["external"]["useExistingNetwork"]) {
				if(!$scope.formExternalNetworkConfiguration.$valid) {
					
					// Set the submitted value to highlight the error field
					$scope.submitted = 4;
					
					console.log("EXTERNAL form validation failed");
					$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.MANDATORY_FIELDS_MSG');
					return;
				}
			}
		} else if(networkType == "MGMT") {
			// Do not validate if Use Existing Network option is selected
			if(!$scope.networkConfig["mgmt"]["useExistingNetwork"]) {
				if(!$scope.formMgmtNetworkConfiguration.$valid) {
					
					// Set the submitted value to highlight the error field
					$scope.submitted = 5;
					
					console.log("EXTERNAL form validation failed");
					$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.MANDATORY_FIELDS_MSG');
					return;
				}
			}
		} else if(networkType == "DMZ") {
			if(!$scope.formDMZNetworkConfiguration.$valid) {
				
				// Set the submitted value to highlight the error field
				$scope.submitted = 6;
				
				console.log("DMZ form validation failed");
				$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.MANDATORY_FIELDS_MSG');
				return;
			}
		}
		
		var subnet = data["subnet"]["part1"]+"."+data["subnet"]["part2"]+"."+data["subnet"]["part3"]+"."+data["subnet"]["part4"];
		var subnetMask = data["subnetMask"]["part1"]+"."+data["subnetMask"]["part2"]+"."+data["subnetMask"]["part3"]+"."+data["subnetMask"]["part4"];
		var subnetName = data["subnetName"];
		
		// We need to validate the configuration only if the user has opted for custom configuration
		var validateNetworkConfigurationForNameAndOverlap = true;
		if(networkType == "EXTERNAL") {
			// Do not validate if Use Existing Network option is selected
			if($scope.networkConfig["external"]["useExistingNetwork"]) {
				validateNetworkConfigurationForNameAndOverlap = false;
			}
		}
		if(networkType == "MGMT") {
			// Do not validate if Use Existing Network option is selected
			if($scope.networkConfig["mgmt"]["useExistingNetwork"]) {
				validateNetworkConfigurationForNameAndOverlap = false;
			}
		}
		if(validateNetworkConfigurationForNameAndOverlap) {
			VDIWorkloadConfigurationService.validateNetworkConfiguration(subnet, subnetMask, subnetName, function(dataResp, status) {
				if(dataResp.status == "Success") {
					// If there is a object that is sent back with success .. then we replace the object before sending it to the server to save
					if(dataResp.message == "use_existing") {
						console.log("The server says there is a exactly same network .. so use that network");
					}
					$scope.networkConfigScreenSubmit(networkType, data, connectFromEverywhere);
				} else {
					if(dataResp.code == "VRM071402E") {
						// Subnet name exists
						$scope.workloadConfigurationErrorMessage = "The subnet with the same name already exists .. please choose a different subnet name";
					} else if(dataResp.code == "VRM071403E") {
						// Overlap
						$scope.workloadConfigurationErrorMessage = "The subnet already exists .. please choose a different IP Range";
					}
				}
			}, function(data, status) {
				// TODO: Display error message
				
			});
		} else {
			$scope.networkConfigScreenSubmit(networkType, data, connectFromEverywhere);
		}
	};
	
	/**
	 * Called when the "Next" on the General screen is submitted
	 * 
	 */
	$scope.generalScreenSubmit = function(data) {
		console.log("Submitting the general screen on workload configuration: ");
		console.log(data);
		
		// Set the submitted value to highlight the error field
		$scope.submitted = 1;
		
		// Clear the error message
		$scope.workloadConfigurationErrorMessage = "";
		
		if($scope.formGeneralConfiguration.$valid) {
			// Prepare data needed by general service
			var basicVDIWorkloadConfigurationObject = new Object();
			basicVDIWorkloadConfigurationObject.workloadName = data["workloadName"];
			basicVDIWorkloadConfigurationObject.persistence = data["persistence"];
			basicVDIWorkloadConfigurationObject.connectFromEverywhere = data["connectVDI"];
			basicVDIWorkloadConfigurationObject.reserveResourcesOnly = data["reserveResourcesOnly"];
			$scope.reserveResourcesOnly = data["reserveResourcesOnly"];
			basicVDIWorkloadConfigurationObject.numberOfVDIs = data["numberOfVDI"];
			basicVDIWorkloadConfigurationObject.cpusPerVDI = data["cpu"];
			basicVDIWorkloadConfigurationObject.ramPerVDI = data["ram"];
			basicVDIWorkloadConfigurationObject.storagePerVDI = data["storage"];
			
			VDIWorkloadConfigurationService.generalScreenSubmitForWorkloadConfiguration($scope.workloadId, basicVDIWorkloadConfigurationObject, function(data, status) {
				// Success callback
				
				// go to the security screen
				$scope.activeNetworkSubtab = 1;
				$scope.workloadWorkflowNavigation(vrmUi.getWorkloadConfigurationValue("NETWORK"));
				
			}, function(data, status) {
				// Error callback (Don't move to the next screen .. and show error message)
				$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.WORKLOAD_CONFIGURATION_ERROR_MSG')+data["code"];
			});
		} else {
			console.log("General form validation failed");
			$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.MANDATORY_FIELDS_MSG');
		}
	};
	
	/**
	 * Called when the "Next" on External network config is selected
	 * 
	 */
	$scope.networkConfigScreenSubmit = function(networkType, data, connectFromEverywhere) {
		console.log("Submitting the "+networkType+" config. network screen on workload configuration: ");
		console.log(data);
		
		var networkVDIWorkloadConfigurationObject = new Object();
		
		// TODO: Validate the Network configuration form
		networkVDIWorkloadConfigurationObject.useExistingNetwork = data["useExistingNetwork"];
		networkVDIWorkloadConfigurationObject.subnetName = data["subnetName"];
		networkVDIWorkloadConfigurationObject.vlanId = data["vlanId"];
		networkVDIWorkloadConfigurationObject.subnet = data["subnet"]["part1"]+"."+data["subnet"]["part2"]+"."+data["subnet"]["part3"]+"."+data["subnet"]["part4"];
		networkVDIWorkloadConfigurationObject.subnetMask = data["subnetMask"]["part1"]+"."+data["subnetMask"]["part2"]+"."+data["subnetMask"]["part3"]+"."+data["subnetMask"]["part4"];
		networkVDIWorkloadConfigurationObject.gateway = data["gateway"]["part1"]+"."+data["gateway"]["part2"]+"."+data["gateway"]["part3"]+"."+data["gateway"]["part4"];
		networkVDIWorkloadConfigurationObject.networkType = networkType;
		
		VDIWorkloadConfigurationService.networkConfigScreenSubmitForWorkloadConfiguration($scope.workloadId, networkType, networkVDIWorkloadConfigurationObject, function(data, status) {
			// Success callback
			
			// Go to appropriate
			if(networkType == "EXTERNAL") {
				// Go to mgmt
				$scope.activeNetworkSubtab = 2;
			} else if(networkType == "MGMT") {
				// Based on the connect from everywhere option we either go to the DMZ screen or the security config screen
				if(connectFromEverywhere) {
					// Go to DMZ
					$scope.activeNetworkSubtab = 3;
				} else {
					// go to the security config screen
					$scope.workloadWorkflowNavigation(vrmUi.getWorkloadConfigurationValue("SECURITY"));
				}
			} else if(networkType == "DMZ") {
				// go to the security config screen
				$scope.workloadWorkflowNavigation(vrmUi.getWorkloadConfigurationValue("SECURITY"));
			}
		}, function(data, status) {
			// Error callback (Dont move to the next screen .. and show error message)
			$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.INTERNAL_ERROR_WHILE_SAVING_NETWORK_INFO')+data["code"];
		});
		
	};
	
	/**
	 * Called when the "Next" on the Security screen is submitted
	 * 
	 */
	$scope.securityScreenSubmit = function(data) {
		console.log("Submitting the security screen on workload configuration: ");
		console.log(data);
		
		// Set the submitted value to highlight the error field
		$scope.submitted = 2;
		
		// Clear the error message
		$scope.workloadConfigurationErrorMessage = "";
		
		if($scope.formSecurityConfiguration.$valid) {
			// Prepare data needed by security service
			var securityVDIWorkloadConfigurationObject = new Object();
			securityVDIWorkloadConfigurationObject.systemAdministratorPassword = data["adminPassword"];
			securityVDIWorkloadConfigurationObject.dnsServerIp = data["dnsIP"]["part1"]+"."+data["dnsIP"]["part2"]+"."+data["dnsIP"]["part3"]+"."+data["dnsIP"]["part4"];
			securityVDIWorkloadConfigurationObject.trustExistingActiveDirectory = data["checkTrustAD"];
			securityVDIWorkloadConfigurationObject.existingActiveDirectory = data["trustInput"];
			
			
			VDIWorkloadConfigurationService.securityScreenSubmitForWorkloadConfiguration($scope.workloadId, securityVDIWorkloadConfigurationObject, function(data, status) {
				// Success callback
				
				// go to the system config screen
				$scope.workloadWorkflowNavigation(vrmUi.getWorkloadConfigurationValue("SYSTEM_CONFIG"));
				
			}, function(data, status) {
				// Error callback (Dont move to the next screen .. and show error message)
				$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.INTERNAL_ERROR_WHILE_SAVING_SECURITY_INFO')+data["code"];
			});
		} else {
			console.log("Security form validation failed");
			$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.MANDATORY_FIELDS_MSG');
		}
	};
	
	
	/**
	 * Called when the "Next" on the System config screen is submitted
	 * 
	 */
	$scope.systemConfigScreenSubmit = function(data) {
		console.log("Submitting the security screen on workload configuration: ");
		console.log(data);
		
		// Prepare data needed by the system config
		var systemVDIWorkloadConfigurationObject = new Object();
		
		//checking iso file extension
		var isofilename = data["isoFileName"];
		var isovalues = isofilename.split(".");
		$scope.isofileextension = isovalues[isovalues.length-1];
		console.log("Extension="+$scope.isofileextension);
		
		//checking ova file extension
		var ovafilename = data["ovaFileName"];
		var ovavalues = ovafilename.split(".");
		$scope.ovafileextension = ovavalues[ovavalues.length-1];
		console.log("Extension="+$scope.ovafileextension);
		
		systemVDIWorkloadConfigurationObject.windowsIsoFile = data["isoFileName"];
		systemVDIWorkloadConfigurationObject.ovaFile = data["ovaFileName"];
		systemVDIWorkloadConfigurationObject.windowsLicenseKey = data["licenseKey"];
		
		var flag = false;
		$scope.workloadConfigurationErrorMessage = "";
		if($scope.isoFileUploadComplete == false){
			//chk ISO the file is selected or not
			if($scope.isoFileSelected == true && $scope.isofileextension == vrmUi.getWorkloadConfigurationValue("ISO")){
				$timeout(function() {
					var el = document.getElementById(vrmUi.getWorkloadConfigurationValue("SELECTED_ISO_FILE"));
			        angular.element(el).triggerHandler(vrmUi.getWorkloadConfigurationValue("CLICK"));
				}, 0);
				
				flag = true;
				
				$rootScope.modalInstance = $modal.open({
		            templateUrl: vrmUi.getWorkloadConfigurationValue("VDI_PROGRESS"),
		            size: vrmUi.getWorkloadConfigurationValue("SIZE"),
		            backdrop: vrmUi.getWorkloadConfigurationValue("BACKDROP"),
		            keyboard: false
		        });
			} else {
				$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.SELECT_ISO_FILE');
				return;
			}
		}
			
		// Validate the OVA file only of Reserve Resources Only is not checked
		if(!$scope.reserveResourcesOnly) {
			if($scope.ovaFileUploadComplete == false){
				//chk OVA the file is selected or not
				if($scope.ovaFileSelected == true && $scope.ovafileextension == vrmUi.getWorkloadConfigurationValue("OVA")){
					
					$timeout(function() {
						var el = document.getElementById(vrmUi.getWorkloadConfigurationValue("SELECTED_OVA_FILE"));
				        angular.element(el).triggerHandler(vrmUi.getWorkloadConfigurationValue("CLICK"));
					}, 0);
					
					if(flag == false){
						flag  = true;
						$rootScope.modalInstance = $modal.open({
				            templateUrl: vrmUi.getWorkloadConfigurationValue("VDI_PROGRESS"),
				            size: vrmUi.getWorkloadConfigurationValue("SIZE")
				        });
					}
				} else {
					$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.SELECT_OVA_FILE');
					return;
				}
			}
		}
		
		if(flag) {
			// This means that the progress bar is displayed
			return;
		}
		
		// Validate all forms
		if(!$scope.validateAllForms()) {
			return;
		}
			
		// Show the loading mask since this call might require some time to come back
		$rootScope.ShowFullScreenLoading = true;
		$rootScope.ShowFullScreenLoadingMsg = $filter('translate')('workloadconfiguration.controller.SAVING_WORKLOAD_CONFIG');
		VDIWorkloadConfigurationService.systemConfigScreenSubmitForWorkloadConfiguration($scope.workloadId, systemVDIWorkloadConfigurationObject, function(data, status) {
			// Success callback
			
			// Hide the loading mask
			$rootScope.ShowFullScreenLoading = false;
			$rootScope.ShowFullScreenLoadingMsg = '';
			
			// This request returns us the updated Workload object .. hence call method to refresh the scope object
			$scope.setScopeVariablesForUI(data);
			
		}, function(data, status) {
			$rootScope.ShowFullScreenLoading = false;
			$rootScope.ShowFullScreenLoadingMsg = '';
			// Error callback (Dont move to the next screen .. and show error message)
			$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.INTERNAL_ERROR_WHILE_SAVING_SYSTEM_INFO')+data["code"];
		});
		
		// go to the review screen
		$scope.workloadWorkflowNavigation("review");
	};
	
	/**
	 * Validating all the forms before we create 
	 * 
	 */
	$scope.validateAllForms = function() {
		// Validate General Form
		if(!$scope.formGeneralConfiguration.$valid) {
			console.log("General form validation failed");
			// go to the general screen
			$scope.workloadWorkflowNavigation(vrmUi.getWorkloadConfigurationValue("GENERAL"));
			$scope.submitted = 1;
			$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.MANDATORY_FIELDS_MSG');
			return false;
		}
		// Validate Network Form (formExternalNetworkConfiguration, formMgmtNetworkConfiguration, formDMZNetworkConfiguration)
		if(!$scope.formExternalNetworkConfiguration.$valid) {
			// Do not validate is Use Existing Network is selected
			if(!$scope.networkConfig["external"]["useExistingNetwork"]) {
				console.log("Network form validation failed");
				// go to the network screen
				$scope.workloadWorkflowNavigation(vrmUi.getWorkloadConfigurationValue("NETWORK"));
				$scope.activeNetworkSubtab = 1;
				$scope.submitted = 4;
				$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.MANDATORY_FIELDS_MSG');
				return false;
			}
		}
		if(!$scope.formMgmtNetworkConfiguration.$valid) {
			// Do not validate is Use Existing Network is selected
			if(!$scope.networkConfig["mgmt"]["useExistingNetwork"]) {
				console.log("Network form validation failed");
				// go to the network screen
				$scope.workloadWorkflowNavigation(vrmUi.getWorkloadConfigurationValue("NETWORK"));
				$scope.activeNetworkSubtab = 2;
				$scope.submitted = 5;
				$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.MANDATORY_FIELDS_MSG');
				return false;
			}
		}
		
		// TODO: Validate the DMZ network configuration form (Only validate this form if the connect from everywhere is checked)
		
		
		if(!$scope.formSecurityConfiguration.$valid) {
			console.log("Security form validation failed");
			// go to the security screen
			$scope.workloadWorkflowNavigation(vrmUi.getWorkloadConfigurationValue("SECURITY"));
			$scope.submitted = 2;
			$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.MANDATORY_FIELDS_MSG');
			return false;
		}
		
		// Check if the files are uploaded completely or not
		if(!$scope.isoFileUploadComplete) {
			$scope.workloadWorkflowNavigation(vrmUi.getWorkloadConfigurationValue("SYSTEM_CONFIG"));
			$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.MANDATORY_FIELDS_MSG');
			return;
		} else {
			$scope.workloadConfigurationErrorMessage = "";
		}
		
		// Validate the System Config form
		if(!$scope.formSystemConfiguration.$valid) {
			console.log("System config form validation failed");
			$scope.workloadWorkflowNavigation(vrmUi.getWorkloadConfigurationValue("SYSTEM_CONFIG"));
			$scope.submitted = 3;
			$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.MANDATORY_FIELDS_MSG');
			return false;				
		}
		
		return true;
	};
	
	$scope.workloadWorkflowNavigation = function(screenToShow) {
		console.log("Navigating to the screen: "+screenToShow);
		
		// First we clear the error message
		$scope.workloadConfigurationErrorMessage = "";
		
		// Clear the submitted fields too
		$scope.submitted = 0;
		
		$scope.workloadScreenShow = screenToShow;
		
		// If screen to show is review .. then we fetch the status to enable-disable the "Finish" button
		if(screenToShow == vrmUi.getWorkloadConfigurationValue("REVIEW")) {
			// Fetch the workload status
			//$scope.fetchWorkloadStatus();
		}
	};
	
	$scope.triggerWorkloadConfiguration = function(workloadId) {
		console.log("Submitting the review form to create a workload configuration for workloadId: "+workloadId);
		
		// Validate all forms
		if(!$scope.validateAllForms()) {
			return;
		}
		
		// Validate the IPs assigned
		if($scope.viewServers["securityServers"] != $scope.fetchSizeMap($scope.viewServers["securityServerList"])) {
			$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.NO_FREE_IPADDRESSES');
			return false;
		}
		
		if($scope.viewServers["connectionServers"] != $scope.fetchSizeMap($scope.viewServers["connectionServerList"])) {
			$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.NO_FREE_IPADDRESSES');
			return false;
		}
		
		if($scope.viewServers["composerServers"] != $scope.fetchSizeMap($scope.viewServers["composerServerList"])) {
			$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.NO_FREE_IPADDRESSES');
			return false;
		}
		
		if($scope.viewServers["vCenterServers"] != $scope.fetchSizeMap($scope.viewServers["vCenterServerList"])) {
			$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.NO_FREE_IPADDRESSES');
			return false;
		}
		
		VDIWorkloadConfigurationService.triggerWorkloadConfiguration(workloadId, function(data, status) {
			
			// Go to the progress screen
			//$scope.workloadWorkflowNavigation("workload-progress");
			console.log(data.object.status)
			if(data.object.status) {
				
				// The progress screen is now disabled .. show a popup instead
				$rootScope.vdiProcessInstance = $modal.open({
		            templateUrl: vrmUi.getWorkloadConfigurationValue("VDI_TRIGGER_PROGRESS"),
		            size: vrmUi.getWorkloadConfigurationValue("SIZE"),
		            backdrop: vrmUi.getWorkloadConfigurationValue("BACKDROP"),
		            keyboard: false
		        });
			} else {
				if(data.object.messageCode == 1) {
					$scope.workloadConfigurationErrorMessage = "One instance of this workload is in progress. Please wait for it to complete.";
				} else if(data.object.messageCode == 2) {
					$scope.workloadConfigurationErrorMessage = "No host with valid CPU cores, disks and memory found.";
				} else  if(data.object.messageCode == 3) {
					$scope.workloadConfigurationErrorMessage = "Invalid data for the node zero host.";
				}
			}
				
		}, function(data, status) {
			// Error callback (Dont move to the next screen .. and show error message)
			$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.INTERNAL_ERROR_WHILE_TRIGGERING_WORKLOAD_CONFIG')+data["code"];
		});
		
	};
	
	$scope.closeVDIAndProcessPopup = function() {
		$scope.closeVDIPopup();
		$rootScope.vdiProcessInstance.close();
	};
	
	$scope.cancel = function() {
		// If file upload is in progress .. notify the user that he can't close the box until the upload is complete
		if($scope.isoFileUploadProgress || $scope.ovaFileUploadProgress) {
			$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.FILE_UPLOAD_PROGRESS');
			return;
		}
		
		// Show a warning message to the user that if he cancels .. all unsaved data will be lost
		$rootScope.vdiCancelInstance = $modal.open({
            templateUrl: vrmUi.getWorkloadConfigurationValue("VDI_CANCEL_URL"),
            size: vrmUi.getWorkloadConfigurationValue("SIZE"),
            backdrop: vrmUi.getWorkloadConfigurationValue("BACKDROP"),
            keyboard: false
        });
    };
    
    $scope.cancelConfirmOk = function() {
    	
    	console.log("Confirmed delete for workloadId: "+$rootScope.rootScopeWorkloadId);
    	
    	// Show loading mask
    	$rootScope.ShowFullScreenLoading = true;
		$rootScope.ShowFullScreenLoadingMsg = $filter('translate')('workloadconfiguration.controller.DELETING_WORKLOAD_WAIT_MESSAGE');
		
    	// Call to delete the workload id from the ZK
    	VDIWorkloadConfigurationService.deleteWorkloadConfiguration($rootScope.rootScopeWorkloadId, function(data) {
    		
    		// Hide loading mask
    		$rootScope.ShowFullScreenLoading = false;
    		$rootScope.ShowFullScreenLoadingMsg = "";
    		
    		$scope.closeVDIPopup();
    		$scope.cancelConfirmClose();
    	}, function(data) {
    		
    		// Hide loading mask
    		$rootScope.ShowFullScreenLoading = false;
    		$rootScope.ShowFullScreenLoadingMsg = "";
    		
    		$scope.closeVDIPopup();
    		$scope.cancelConfirmClose();
    	});
    	
    	
    };
    
    $scope.closeVDIPopup = function() {
    	$rootScope.VDIInstance.close();
		$location.path(vrmUi.getWorkloadConfigurationValue("DASHBOARD_URL"));
        $route.reload();
    };
    
    $scope.cancelConfirmClose = function() {
    	$rootScope.vdiCancelInstance.close();
    };
    
    /*$scope.fetchWorkloadStatus = function() {
    	console.log("Fetching the workload status for for workloadId: "+$scope.workloadId);
    	$scope.workloadTriggerDisabled = false;
    	
    	if($scope.workloadId == "" || $scope.workloadId == "0"  || $scope.workloadId == null || $scope.workloadId == undefined) {
    		return;
    	}
    	
		VDIWorkloadConfigurationService.fetchWorkloadStatus($scope.workloadId, function(data, status) {
			
			// Check if there is any "message" response from the server
			if(data.message != "") {
				if(data.message == vrmUi.getWorkloadConfigurationValue("RUNNING") || data.message == vrmUi.getWorkloadConfigurationValue("MSG_SUCCESS")) {
					console.log("The workload status is running for workloadId: "+$scope.workloadId+".. hence disable the finish button");
					$scope.workloadTriggerDisabled = true;
				}
			}
			
		}, function(data, status) {
			// Error callback
			// Show the error message on the screen
			$scope.workloadConfigurationErrorMessage = $filter('translate')('workloadconfiguration.controller.INTERNAL_ERROR_WHILE_FETCHING_WORKLOAD_STATUS')+data["code"];
		});
    };*/
    
    // Fetch the existing workload configuration
    // Call in ng-init instead
	//$scope.fetchExistingWorkloadConfiguration();
	
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
			console.log("File uploads currently in progress .. hence returning");
			return false;
		} else {
		
			// Close the popup
			$rootScope.modalInstance.close();
			
			$timeout(function() {
				var el = document.getElementById(vrmUi.getWorkloadConfigurationValue("SYSTEM_CONFIG_NXT"));
		        angular.element(el).triggerHandler(vrmUi.getWorkloadConfigurationValue("CLICK"));
			 }, 0);
		}
	};
});