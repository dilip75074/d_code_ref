/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.service('ActivityService', function(HttpCommunicationUtil) {
	
	this.fetchCountDetails = function(url, successCB, errorCB){
		HttpCommunicationUtil.doGet(url, successCB, errorCB);
	};
	
	this.fetchList = function(url, successCB, errorCB){
		HttpCommunicationUtil.doGet(url, successCB, errorCB);
	};
	
	this.fetchAlarms = function(url, successCB, errorCB){
		HttpCommunicationUtil.doGet(url, successCB, errorCB);
	};
});