/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

var HttpCommunicationUtil = function($http, $rootScope) {
	var factory = {};
	// Commented "/rest" since its not used now. We gradually need to shift all end-points away from "/rest" since it wont be used and disabled eventually
	//var baseUrl = context + "/rest/";
	//TODO: This endpoint should be used...
	var baseUrl = context + "/api/1.0/";

	factory.doPost = function(url, data, successCallbackFunction, errorCallbackFunction){
		$http.post(baseUrl + url, data)
		.success(function(data, status, headers, config){
			if(undefined == data.code)
			{
				data["code"] = "NA";
			}
			successCallbackFunction(data, status, headers, config);
		})
		.error(function(data, status, headers, config){
			console.log("Error callback called for url: "+url+" with POST method with status: "+status+" and data: ");
			console.log(data);
			if(null!=data && undefined == data.code)
			{
				data = {};
				data["code"] = "NA";
				
				if((null!=data.message && data.message.indexOf("AccessDeniedException")>-1)||status=="403"){
	        		// TODO: Add message to show access denied
					$rootScope.ShowFullScreenLoading = false;
	        	}else{
	        		errorCallbackFunction(data, status, headers, config);
	        	}
			}
		});
	},
	
	factory.doPut = function(url, data, successCallbackFunction, errorCallbackFunction){
		$http.put(baseUrl + url, data)
		.success(function(data, status, headers, config){
			if(undefined == data.code)
			{
				data["code"] = "NA";
			}
			successCallbackFunction(data, status, headers, config);
		})
		.error(function(data, status, headers, config){
			console.log("Error callback called for url: "+url+" with PUT method with status: "+status+" and data: ");
			console.log(data);
			if(null!=data && undefined == data.code)
			{
				data = {};
				data["code"] = "NA";
				
				if((null!=data.message && data.message.indexOf("AccessDeniedException")>-1)||status=="403"){
	        		// TODO: Add message to show access denied
					$rootScope.ShowFullScreenLoading = false;
	        	}else{
	        		errorCallbackFunction(data, status, headers, config);
	        	}
			}
		});
	},

	factory.doGet = function(url, successCallbackFunction, errorCallbackFunction, params, forbiddenCallbackFunction){
		$http.get(baseUrl + url, {params: params})
		.success(function(data, status, headers, config){
			if(undefined == data.code)
			{
				data["code"] = "NA";
			}
			successCallbackFunction(data, status, headers, config);
		})
		.error(function(data, status, headers, config){
			console.log("Error callback called for url: "+url+" with method GET with status: "+status+" and data: ");
			console.log(data);
			if(null!=data && undefined == data.code)
			{
				data = {};
				data["code"] = "NA";
				
				if((null!=data.message && data.message.indexOf("AccessDeniedException")>-1)||status=="403"){
	        		// TODO: Add message to show access denied
					$rootScope.ShowFullScreenLoading = false;
					forbiddenCallbackFunction(data);
	        	}else{
	        		errorCallbackFunction(data, status, headers, config);
	        	}
			}
		});
	};
	
	factory.doDelete = function(url, successCallbackFunction, errorCallbackFunction){
		$http.delete(baseUrl+url)
		.success(function(data, status, headers, config){
			if(undefined == data.code)
			{
				data["code"] = "NA";
			}
			successCallbackFunction(data, status, headers, config);
		})
		.error(function(data, status, headers, config){
			console.log("Error callback called for url: "+url+" with method DELETE status: "+status+" and data: ");
			console.log(data);
			if(null!=data && undefined == data.code)
			{
				data = {};
				data["code"] = "NA";
				
				if((null!=data.message && data.message.indexOf("AccessDeniedException")>-1)||status=="403"){
	        		// TODO: Add message to show access denied
					$rootScope.ShowFullScreenLoading = false;
	        	}else{
	        		errorCallbackFunction(data, status, headers, config);
	        	}
			}
		});
	};
	
	factory.jsonP = function(url, successCallbackFunction, errorCallbackFunction){
		$http.jsonp(url);
	};

	return factory;
};

if(typeof noSecvrmUI !== 'undefined') {
	noSecvrmUI.factory('HttpCommunicationUtil', HttpCommunicationUtil);
}
if(typeof vrmUI !== 'undefined') {
	vrmUI.factory('HttpCommunicationUtil', HttpCommunicationUtil);
}
