/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

 vrmUI.service('IpReallocationService', function(HttpCommunicationUtil) {

	 /**
	  * Service method to fetch the IP Reallocation Plan
	  * 
	  */
	 this.fetchIpReallocationPlan = function(successCallback, errorCallback){
		 console.log("Inside service method to fetch the IP Reallocation Plan");

		 //HttpCommunicationUtil.doGet('json/ipReallocationPlan.json', successCallback, errorCallback);
		 HttpCommunicationUtil.doGet(vrmUi.getValue("fetchIpReallocationPlanAPI"), successCallback, errorCallback);
	 };
	 
	 /**
	  * Service Method to confirm the IP Reallocation Plan
	  * 
	  */
	 this.confirmIpReallocationService = function(data, successCallback, errorCallback) {
		 console.log("Inside the service method for confirming the IP Reallocation Plan: ");
		 console.log(data);
		 
		 // TODO: Uncomment when the actual call is made active
		 HttpCommunicationUtil.doPost(vrmUi.getValue("confirmIpReallocationServiceAPI"), data, successCallback, errorCallback);
	 };
	 
	 /**
	  * Service Method to rerun the IP Reallocation Plan
	  * 
	  */
	 this.rerunIpReallocationService = function(successCallback, errorCallback) {
		 console.log("Inside the service method for rerun the IP Reallocation Plan: ");
		 HttpCommunicationUtil.doPut(vrmUi.getValue("rerunIpReallocationServiceAPI"), null, successCallback, errorCallback);
	 };
	 
});