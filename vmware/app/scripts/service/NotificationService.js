/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.service('NotificationService', function(HttpCommunicationUtil){
	/*
	 * Fetches notification List
	 */
	this.fetchNotification = function(url, successCallback, errorCallback){
	 	//HttpCommunicationUtil.doGet('../../json/notificationList.json', successCallback, errorCallback);
		HttpCommunicationUtil.doGet(url, successCallback, errorCallback);
	};
	
	/*
	 * Fetches notification Count
	 */
	this.fetchNotificationCount = function(successCallback, errorCallback){
		HttpCommunicationUtil.doGet(vrmUi.getValue("fetchNotificationCountAPI"), successCallback, errorCallback);
		//HttpCommunicationUtil.doGet('../../json/notificationCount.json', successCallback, errorCallback);
	};
});