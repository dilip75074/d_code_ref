/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.service('AddPermissionService', function(HttpCommunicationUtil) {
	
	this.fetchDomainList = function(successCB, errorCB){
		HttpCommunicationUtil.doGet(vrmUi.getValue("fetchDomainListAPI"), successCB, errorCB);
	};
	
	this.fetchRoleList = function(successCB, errorCB){
		HttpCommunicationUtil.doGet(vrmUi.getValue("fetchRoleListAPI"), successCB, errorCB);
	};
	
	this.fetchUsers = function(url, successCB, errorCB, params){
		HttpCommunicationUtil.doGet(url, successCB, errorCB, params);
	};
	
	this.submitUserDetails = function(data, successCB, errorCB){
		HttpCommunicationUtil.doPut(vrmUi.getValue("submitUserDetailsAPI"), data, successCB, errorCB);
	};
});