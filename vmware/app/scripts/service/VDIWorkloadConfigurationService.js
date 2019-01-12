/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

 vrmUI.service('VDIWorkloadConfigurationService', function(HttpCommunicationUtil) {
	 
	/**
	 * Method to submit the general information for workload configuration
	 * 
	 */
	this.generalScreenSubmitForWorkloadConfiguration = function(workloadId, data, successCB, errorCB) {
        console.log("In WorkloadConfigurationService for general submit for workloadId: "+workloadId);
        
        // Call for general screen submit (mainly save in JAVA layer and also execute the View Servers Algorithm)
        HttpCommunicationUtil.doPost(vrmUi.getValue("generalScreenSubmitForWorkloadConfigurationAPI")+workloadId, data, successCB, errorCB);
    };
    
    this.validateNetworkConfiguration = function(subnet, subnetMask, subnetName, successCB, errorCB) {
    	console.log("In validate network configuration for subnet: "+subnet+", subnetMask: "+subnetMask+", subnetName: "+subnetName);
    	
    	HttpCommunicationUtil.doGet(vrmUi.getValue("validateNetworkConfigurationWorkloadConfigurationAPI")+"subnet/"+subnet+"/subnetmask/"+subnetMask+"/subnetname/"+subnetName, successCB, errorCB);
    };
    
    /**
	 * Method to submit the general information for workload configuration
	 * 
	 */
	this.networkConfigScreenSubmitForWorkloadConfiguration = function(workloadId, networkType, data, successCB, errorCB) {
        console.log("In WorkloadConfigurationService for "+networkType+" network configuration submit for workloadId: "+workloadId);
        
        // Call for general screen submit (mainly save in JAVA layer and also execute the View Servers Algorithm)
        HttpCommunicationUtil.doPost(vrmUi.getValue("networkScreenSubmitForWorkloadConfigurationAPI")+networkType+"/"+workloadId, data, successCB, errorCB);
    };
    
    /**
     * Method to save the security information for workload configuration
     * 
     */
    this.securityScreenSubmitForWorkloadConfiguration = function(workloadId, data, successCB, errorCB) {
        console.log("In WorkloadConfigurationService for security submit for workloadId: "+workloadId);
        
        // Call for security screen submit (mainly save in JAVA layer and also execute the View Servers Algorithm)
        HttpCommunicationUtil.doPost(vrmUi.getValue("securityScreenSubmitForWorkloadConfigurationAPI")+workloadId, data, successCB, errorCB);
	};
	
	/**
     * Method to save the system config information for workload configuration
     * 
     */
    this.systemConfigScreenSubmitForWorkloadConfiguration = function(workloadId, data, successCB, errorCB) {
        console.log("In WorkloadConfigurationService for security submit");
        
        // Call for security screen submit (mainly save in JAVA layer and also execute the View Servers Algorithm)
        HttpCommunicationUtil.doPost(vrmUi.getValue("systemConfigScreenSubmitForWorkloadConfigurationAPI")+workloadId, data, successCB, errorCB);
	};
	
	/**
	 * Method to fetch the workload configuration
	 */
	this.fetchVDIWorkloadConfiguration = function(workloadId, successCB, errorCB) {
		console.log("Fetching the existing workload configuration for workloadId: "+workloadId);
		HttpCommunicationUtil.doGet(vrmUi.getValue("fetchVDIWorkloadConfigurationAPI")+workloadId, successCB, errorCB);
		//HttpCommunicationUtil.doGet("../../json/vdiSample.json", successCB, errorCB);
	};
	
	/**
	 * Method to fetch the workload configuration
	 */
	this.createNewWorkloadConfiguration = function(successCB, errorCB) {
		console.log("Creating a new workload configuration");
		HttpCommunicationUtil.doPost(vrmUi.getValue("createNewWorkloadConfigurationAPI"), null, successCB, errorCB);
	};
	
	/**
	 * Method to trigger the workload configuration
	 * 
	 */
	this.triggerWorkloadConfiguration = function(workloadId, successCB, errorCB) {
		console.log("Creating the workload configuration service method");
		HttpCommunicationUtil.doPost(vrmUi.getValue("triggerWorkloadConfigurationAPI")+workloadId, null, successCB, errorCB);
	};
	
	/**
	 * Method to fetch the status of a given workload ID
	 * 
	 */
	this.fetchWorkloadStatus = function(workloadId, successCB, errorCB) {
		console.log("Fetching the workload status service method for workloadId: "+workloadId);
		HttpCommunicationUtil.doGet(vrmUi.getValue("vdi")+workloadId+vrmUi.getValue("vdiStatus"), successCB, errorCB);
	};
	
	/**
	 * Method to delete a workload if not triggered from the UI
	 * 
	 */
	this.deleteWorkloadConfiguration = function(workloadId, successCB, errorCB) {
		console.log("Deleting the workload configuration for workloadId: "+workloadId);
		HttpCommunicationUtil.doDelete("vdi/workloadconfiguration/"+workloadId, successCB, errorCB);
	};
	
 });