/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

 vrmUI.service('PropertyService', function(HttpCommunicationUtil) {
	 
	 /**
	  * Method to fetch all the properties
	  * 
	  */
	 this.fetchProperties = function(successProperties, errorProperties) {
 		console.log("In PropertyService for resources");

 		// Fetching all properties
 		//HttpCommunicationUtil.doGet('json/propertyList.json', successProperties, errorProperties);
 		HttpCommunicationUtil.doGet(vrmUi.getValue("fetchPropertiesAPI"), successProperties, errorProperties);
 	};
 	
 });