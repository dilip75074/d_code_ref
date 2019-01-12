/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.service('PermissionService', function(HttpCommunicationUtil){
	this.fetchAllPermissions = function(successCallback, errorCallback){
		//HttpCommunicationUtil.doGet('../json/permissions.json', successCallback, errorCallback);
	 	HttpCommunicationUtil.doGet(vrmUi.getValue("fetchAllPermissionsAPI"), successCallback, errorCallback);
	};

	this.fetchAllRoles = function(successCallback, errorCallback){
		//HttpCommunicationUtil.doGet('../json/roles.json', successCallback, errorCallback);
		HttpCommunicationUtil.doGet(vrmUi.getValue("fetchAllRolesAPI"), successCallback, errorCallback);
	};

	this.deletePermission = function(data, successCallback, errorCallback){
		HttpCommunicationUtil.doDelete(vrmUi.getValue("deletePermissionAPI") + data.permissionId, successCallback, errorCallback);
	};

	this.updatePermissions = function(data, successCallback, errorCallback){
		HttpCommunicationUtil.doPut(vrmUi.getValue("updatePermissionsAPI"), data, successCallback, errorCallback);
	};
});