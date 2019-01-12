/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

 vrmUI.service('VDIConstantService', function(HttpCommunicationUtil) {
	 
	 /**
	  * Method to fetch all the constants
	  * 
	  */
	 this.fetchConstants = function(successCb, errorCb) {
 		console.log("In VDI Constants service fetchConstants");

 		// Fetching all constants
 		HttpCommunicationUtil.doGet(vrmUi.getValue("constantsAPI"), successCb, errorCb);
 	};
	
	/**
	  * Method to save constants
	  * 
	  */
	 this.saveUpdateConstants = function(data, successCb, errorCb) {
 		console.log("In VDI Constants Service service save Update Constants: ");
 		console.log(data);

 		// Saving all constants
 		HttpCommunicationUtil.doPut(vrmUi.getValue("constantsAPI"), data, successCb, errorCb);
 	};
 	
 	/**
	  * Method to revert to default values
	  */
	 this.revertToDefault = function(successCb, errorCb) {
		console.log("In Role service removeRole ");

		// Delete role
		HttpCommunicationUtil.doPut(vrmUi.getValue("constantsRevertDefaultAPI"), successCb, errorCb);
	};
 	
 });