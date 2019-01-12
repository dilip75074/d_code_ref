/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.service('SettingService', function(HttpCommunicationUtil) {
	
	this.fetchThresholdcategories = function(successCB, errorCB){
		HttpCommunicationUtil.doGet(vrmUi.getValue("fetchThresholdcategoriesAPI"), successCB, errorCB);
	};
	
	this.fetchTypes = function(successCB, errorCB){
		HttpCommunicationUtil.doGet(vrmUi.getValue("fetchTypesAPI"), successCB, errorCB);
	};
	
	this.fetchThresholdList = function(pageNumber, successCB, errorCB){
		//HttpCommunicationUtil.doGet('../../json/thresholdList.json', successCB, errorCB);
		HttpCommunicationUtil.doGet(vrmUi.getValue("fetchThresholdListAPI")+pageNumber, successCB, errorCB);
	};
	
	this.addEditThreshold = function(data, successCB, errorCB){
		HttpCommunicationUtil.doPut(vrmUi.getValue("thresholdAPI"), data, successCB, errorCB);
	};
	
	this.deleteThreshold = function(thresholdId, successCB, errorCB){
		HttpCommunicationUtil.doDelete(vrmUi.getValue("thresholdAPI")+thresholdId, successCB, errorCB);
	};
	
	this.OnOffThreshold = function(data, successCB, errorCB){
		HttpCommunicationUtil.doPut(vrmUi.getValue("thresholdAPI"), data, successCB, errorCB);
	};
	
	this.getchVDIzkConstants = function(successCB, errorCB){
		HttpCommunicationUtil.doGet("/vdi/constants", successCB, errorCB);
	};
	
	this.savechVDIzkConstants = function(data, successCB, errorCB) {
		HttpCommunicationUtil.doPut("/vdi/constants", data, successCB, errorCB);
	};
	
	this.restoreDefaultConstants = function(successCB, errorCB) {
		HttpCommunicationUtil.doPut("/vdi/constants/default", "", successCB, errorCB);
	};
});