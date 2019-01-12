/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.service('AlertMessaging', function($rootScope, $timeout) {
	
	$rootScope.alerts = [];
	$rootScope.showErrorPanel = "0px";
	$rootScope.mainPanelMarginTop = "0px";
	$rootScope.alerMsgHeight = 46;
	
	this.closeAlert = function(index) {
		$rootScope.alerts.splice(index, 1);
		var temp = parseInt($rootScope.showErrorPanel) - $rootScope.alerMsgHeight ; // - 46;
		$rootScope.showErrorPanel = temp + "px";
		var marginTop = 100+temp;
		$rootScope.mainPanelMarginTop = marginTop+"px";
	};
	
	this.showAlert = function(message, type){
		if(message.indexOf("NA")){
			message = message.replace("with the code: ", "for more details.");
			message = message.replace("NA", "");
		}
		
		$rootScope.alerts.push({
			type : type, 
			msg : message
		});
		
		// Remove duplicate message from alert messaging
		var isMsgRepeated = false;
    	angular.forEach($rootScope.alerts, function(value, key){
    		if(value.msg==message){
    			if(isMsgRepeated){
    				$rootScope.alerts.pop(value);
    				closeAlert(key);
    			}
    			isMsgRepeated = true;
    		}
    	});
		
    	var temp = parseInt($rootScope.showErrorPanel) + $rootScope.alerMsgHeight; // + 46;
		$rootScope.showErrorPanel = temp + "px";
		var marginTop = 100+temp;
		$rootScope.mainPanelMarginTop = marginTop+"px";
		
		
		/*$timeout(function(){
			$rootScope.alerts = [];
			$rootScope.showErrorPanel = "0px";
		},5000);*/
	};
	
	this.closeAllAlerts = function() {
		$rootScope.alerts = [];
		$rootScope.showErrorPanel = "0px";
		$rootScope.mainPanelMarginTop = "0px";
	};
	
	this.tellAngular = function () {
	       
    	var domElt = document.getElementById('alertMsg');
    	$rootScope.alerMsgHeight = domElt.offsetHeight;
    	
    	/*scope = angular.element(domElt).scope();
        scope.$apply(function() {
            scope.width = window.innerWidth;
            scope.height = window.innerHeight;
        });*/
    };
    
    //first call of tellAngular when the dom is loaded
    //document.addEventListener("DOMContentLoaded", $scope.tellAngular, false);

    //calling tellAngular on resize event
    window.onresize = $rootScope.tellAngular;
});