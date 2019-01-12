/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.service('PhysicalResourcesService', function(HttpCommunicationUtil) {
	/**
	 * get the remoteConsoleDetails for the host
	 */
	this.getRemoteConsoleDetails = function(hostId ,successCallback, errorCallback) {

		HttpCommunicationUtil.doGet(vrmUi.getValue("hostRemoteConsole")+hostId+vrmUi.getValue("remoteConsoleDetails"), successCallback, errorCallback);
	};

	/**
	 * get the Remote Console Display
	 */
	this.getRemoteConsoleDisplay = function(hostId ,consoleType,successCallback, errorCallback) {

		HttpCommunicationUtil.doGet(vrmUi.getValue("hostRemoteConsole")+hostId+"/"+consoleType+vrmUi.getValue("remoteConsoleDisplay"), successCallback, errorCallback);
	};

	this.getAllRack = function(successCallback, errorCallback) {
		console.log("in getAllRack");
		HttpCommunicationUtil.doGet(vrmUi.getValue("getAllRackAPI"), successCallback, errorCallback);
		//HttpCommunicationUtil.doGet('../../json/physicalRackList.json', successCallback, errorCallback);
	};

	this.getRackHost = function(rackId, successCallback, errorCallback) {
		console.log("in getRackHost :: " + rackId);
		HttpCommunicationUtil.doGet(vrmUi.getValue("getRackHostAPI") + rackId + vrmUi.getValue("consolidatedDetails"), successCallback, errorCallback);
		//HttpCommunicationUtil.doGet('../../json/physicalHost.json', successCallback, errorCallback);
	};

	this.getHostDetails = function(rackUUID, hostId, successCallback, errorCallback) {
		console.log("in getHostDetails rackUUID: " + rackUUID);
		console.log("in getHostDetails hostId: " + hostId);

		HttpCommunicationUtil.doGet(vrmUi.getValue("getRackHostAPI") + rackUUID + vrmUi.getValue("host") + hostId, successCallback, errorCallback);
		//HttpCommunicationUtil.doGet('../../json/hostDetail.json', successCallback, errorCallback);
	};
	
	//fetch the host information
	this.getHostInformation = function(node, successCallback, errorCallback) {
		console.log("Node===="+node);
		HttpCommunicationUtil.doGet('prm/host/' + node + "/ethStats", successCallback, errorCallback);
		//HttpCommunicationUtil.doGet('../../json/nicDetails.json', successCallback, errorCallback);
	};

	//fetch the switch information
	this.getSwitchInformation = function(nodeId, successCallback, errorCallback){
		HttpCommunicationUtil.doGet("prm/switch/" + nodeId + "/portStats", successCallback, errorCallback);
		//HttpCommunicationUtil.doGet('../../json/tor1_PortStats.json', successCallback, errorCallback);
	};

	this.hostManagement = function(uuid, hostId, actionType, isHost, successCallback, errorCallback) {
		console.log("in hostManagement actionType: " + actionType);
		console.log("in hostManagement hostId: " + hostId);
		console.log("in hostManagement uuid: " + uuid);
		console.log("in hostManagement isHost: " + isHost);

		HttpCommunicationUtil.doGet(vrmUi.getValue("hostManagementAPI") + uuid + '/' + hostId+"/"+actionType+"/"+isHost, successCallback, errorCallback);
	};
});