/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

 vrmUI.service('PhysicalNetworkSetupService', function(HttpCommunicationUtil) {
	 
	 this.fetchAllNetworkSetups = function(successCallback, errorCallback) {
	 	//HttpCommunicationUtil.doGet('../json/networkSetups.json', successCallback, errorCallback);
	 	HttpCommunicationUtil.doGet(vrmUi.getValue("networkSetupsAPI"), successCallback, errorCallback);

	 };

	 this.submitAllNetworkSetups = function(data, successCallback, errorCallback){
	 	//alert(JSON.stringify(data));
	 	HttpCommunicationUtil.doPost(vrmUi.getValue("networkSetupsAPI"), data, successCallback, errorCallback);
	 };
	 
});