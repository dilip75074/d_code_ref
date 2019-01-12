/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

 vrmUI.service('PrivilegeService', function(HttpCommunicationUtil) {
	 
	 /**
	  * Method to fetch all privileges
	  * 
	  */
	 this.fetchPrivileges = function(successCb, errorCb) {
 		console.log("In Privilege service fetchPrivileges");

 		// Fetching all roles
 		//HttpCommunicationUtil.doGet('../json/privilegeList.json', successCb, errorCb);
 		HttpCommunicationUtil.doGet(vrmUi.getValue("fetchPrivilegesAPI"), successCb, errorCb);
 	};

 	
 	/**
	  * Get all privileges for logged in user
	  * 
	  */
	 this.loggedUserPrivileges = function(successCb, errorCb) {
		console.log("In Privilege service loggedUserPrivileges");

		// Fetching logged in user's privileges
		HttpCommunicationUtil.doGet(vrmUi.getValue("loggedUserPrivileges"), successCb, errorCb);
	};
 });