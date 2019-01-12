/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

 vrmUI.service('ChangePasswordService', function(HttpCommunicationUtil) {

 	this.changePassword = function(data, successCallback, errorCallback){
 		console.log("in ChangePasswordService");

 		var changePasswordObj = {};
 		angular.forEach(data, function(value, key) {
 			changePasswordObj[key] = value;
 		});
 		
		//console.log("properties :: " + JSON.stringify(changePasswordObj));

	  	HttpCommunicationUtil.doPut(vrmUi.getValue("changePasswordAPI"), changePasswordObj, successCallback, errorCallback);
 	};
 });