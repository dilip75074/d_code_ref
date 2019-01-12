/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

 vrmUI.service('RoleService', function(HttpCommunicationUtil) {
	 
	 /**
	  * Method to fetch all the properties
	  * 
	  */
	 this.fetchRoles = function(successCb, errorCb) {
 		console.log("In Role service fetchRole");

 		// Fetching all roles
 		//HttpCommunicationUtil.doGet('../json/roleList.json', successCb, errorCb);
 		HttpCommunicationUtil.doGet(vrmUi.getValue("rolesAPI"), successCb, errorCb);
 	};
	
	/**
	  * Method to save role and privileges
	  * 
	  */
	 this.saveRoles = function(data, successCb, errorCb) {
 		console.log("In Role service saveRoles: ");
 		console.log(data);

 		// Saving all roles
 		HttpCommunicationUtil.doPut(vrmUi.getValue("rolesAPI"), data, successCb, errorCb);
 	};
 	
 	/**
	  * Method to delete role 
	  */
	 this.removeRole = function(roleId, successCb, errorCb) {
		console.log("In Role service removeRole ");

		// Delete role
		HttpCommunicationUtil.doDelete(vrmUi.getValue("removeRoleAPI")+roleId, successCb, errorCb);
	};
 	
 });