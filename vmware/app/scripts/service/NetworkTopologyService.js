/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.service('NetworkTopologyService', function(HttpCommunicationUtil) {


	this.buildNetworkTopologyForDashboard = function(successNT, errorNT) {
		HttpCommunicationUtil.doGet('topology/dashboard/topologyInformation', successNT, errorNT);
	};

	this.getAllSwitches = function(rackIp,rackUUID,rackId,successNT, errorNT) {
		HttpCommunicationUtil.doGet('topology/dashboard/switches'+'/'+rackIp+'/'+rackUUID+'/'+rackId, successNT, errorNT);
	};

	this.getSwitchInformation = function(rackIp,rackId,switchId,successNT, errorNT) {
		HttpCommunicationUtil.doGet('topology/dashboard/switchInformation'+'/'+rackIp+'/'+rackId+'/'+switchId, successNT, errorNT);
	};


	this.getAllHosts = function(rackIp,rackUUID,rackId,successNT, errorNT) {
		HttpCommunicationUtil.doGet('topology/dashboard/hosts'+'/'+rackIp+'/'+rackUUID+'/'+rackId, successNT, errorNT);
	};

	this.getHostInformation = function(rackIp,rackId,hostId,successNT, errorNT) {
		HttpCommunicationUtil.doGet('topology/dashboard/hostInformation'+'/'+rackIp+'/'+rackId+'/'+hostId, successNT, errorNT);
	};




	/**
	 * Save the network Topology object for 1st and 2nd phase: Check Topology.js for more info on phases
	 */
	this.setTopologyDetails = function(networkDetails){
		networkTopologyDetails = networkDetails;
	};

	this.getTopologyDetails = function(){
		return networkTopologyDetails;
	};

	this.setDeviceDetails = function(devDetails){
		deviceDetails = devDetails;
	};

	this.getDeviceDetails = function(){
		return deviceDetails;
	};


});
