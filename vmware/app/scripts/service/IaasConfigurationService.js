/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.service('IaasConfigurationService', function(HttpCommunicationUtil){

	/**
	 * Method to fetch existing workload configuration
	 */
    this.getExistingIaaSWorkloadConfig = function(successCB, errorCB) {
		//HttpCommunicationUtil.doGet("iaas/iaasworkloadconfiguration", successCB, errorCB);
	};

	this.finishWorkloadConfiguration = function(workloadProfileId, successCB, errorCB) {
		console.log("Creating the workload configuration service method");
		HttpCommunicationUtil.doPost(vrmUi.getValue("finishWorkloadConfigurationAPI")+workloadProfileId, null, successCB, errorCB);
		};

	this.getHostCapacity = function(successCB, errorCB) {
		HttpCommunicationUtil.doPost(vrmUi.getValue("getHostCapacityAPI"), null, successCB, errorCB);
	};

	this.workLoadProfile = function(data, successCB, errorCB) {
		HttpCommunicationUtil.doPost(vrmUi.getValue("workLoadProfileAPI"), data, successCB, errorCB);
		//HttpCommunicationUtil.doPost('../../json/workload-profile.json', data, successCB, errorCB);
	};
	
	this.fetchIaaSWorkloadProgress = function(workloadId, workflowsIds, successCB, errorCB) {
		console.log("Fetching the workload progress service method for workloadId: "+workloadId);
		HttpCommunicationUtil.doGet(vrmUi.getValue("fetchIaaSWorkloadProgressAPI")+workloadId+vrmUi.getValue("workflows")+workflowsIds+vrmUi.getValue("progress"), successCB, errorCB);
	};
	
	this.deleteWorkloadProfileById = function(workloadId, successCB, errorCB) {
		HttpCommunicationUtil.doDelete(vrmUi.getValue("deleteWorkloadProfileAPI")+workloadId, successCB, errorCB);
	};

    this.startvCACWorkflow = function(data, successCB, errorCB) {
        HttpCommunicationUtil.doPost(vrmUi.getValue("startvCACWorkflow"), data, successCB, errorCB);
        console.log("Starting vcac workflow: "+data);
    };

    this.deletevCACIP = function(data, successCB, errorCB) {
        HttpCommunicationUtil.doPut(vrmUi.getValue("deleteCACIP"), data, successCB, errorCB);
        console.log("Returning vCAC IP: "+data);
    };

    this.allocatevCACIP = function(workloadId,  successCB, errorCB) {
        console.log("Requesting vCAC IP for: "+workloadId);
        HttpCommunicationUtil.doPost(vrmUi.getValue("allocatevCACIP"), workloadId , successCB, errorCB);
    };

    this.getLastIso = function(successCB, errorCB) {
        console.log("Getting last ISO: ");
        HttpCommunicationUtil.doGet("vcac/last-iso", successCB, errorCB);
    };


    /**
     * Method to fetch the VDI workload configuration (for vCAC)
     */
    this.fetchVDIWorkloadConfiguration = function(workloadId, successCB, errorCB) {
        console.log("Fetching the existing workload configuration for workloadId: "+workloadId);
        HttpCommunicationUtil.doGet(vrmUi.getValue("fetchVDIWorkloadConfigurationAPI")+workloadId, successCB, errorCB);
        //HttpCommunicationUtil.doGet("../../json/vdiSample.json", successCB, errorCB);
    };



});