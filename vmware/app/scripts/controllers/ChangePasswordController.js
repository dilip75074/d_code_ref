/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/
 
vrmUI.controller('ChangePasswordController', function($scope, $rootScope, $location, $route, ChangePasswordService, $filter, $translate) {
	console.log("Change Password Controller Loaded");
	
	// Get the page context object
	$rootScope.pageContextObject = angular.copy($route.current.data);
	// Translate heading
	var headerKey = $rootScope.pageContextObject.pageTitle;
	$rootScope.pageContextObject.pageTitle = "";
	$translate(headerKey)
        .then(function (translatedValue) {
            $rootScope.pageContextObject.pageTitle = translatedValue;
        });
	console.log("Page Context Object for change password screen is: ");
	console.log($rootScope.pageContextObject);
	
	$scope.spaceMessage = null;
	$scope.regexvalue = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@%&*$~^])/;
	$scope.spaceregexvalue = /^(?!.*\s)/;
	$scope.identicaladjacent = /(.)\1{3}/;
	//$scope.startwithletter = /^[A-Za-z]+/;
	$scope.isvalidclass = 1;
	
	//var changedNewPwd = false;
	//var changedConfirmPwd = false;

	/*//dont allow white space in connection name
	$scope.$watch(vrmUi.getChangePasswordValue("DATA_NEW_PASSWORD_MODEL"), function(newValue) {
		if(undefined != newValue)
		{
			var pos = newValue.search(/\s+/g);
			if(pos != -1)
			{
				$scope.spaceMessage = $filter('translate')('changePassword.controller.SPACE_NOT_ALLOWED_MSG');
				changedNewPwd = true;
				return;
			}
			if(pos == -1 && changedNewPwd)
			{
				changedNewPwd = false;
			}
			else if(pos == -1 && !changedNewPwd)
			{
				$scope.spaceMessage = null;
			}
		}
    });*/

    /*//dont allow white space in connection name
	$scope.$watch(vrmUi.getChangePasswordValue("DATA_CONFIRM_PASSWORD_MODEL"), function(newValue) {
		if(undefined != newValue)
		{
			var pos = newValue.search(/\s+/g);
			if(pos != -1)
			{
				$scope.spaceMessage = $filter('translate')('changePassword.controller.SPACE_NOT_ALLOWED_MSG');
				changedConfirmPwd = true;
				return;
			}
			if(pos == -1 && changedConfirmPwd)
			{
				changedConfirmPwd = false;
			}
			else if(pos == -1 && !changedConfirmPwd)
			{
				$scope.spaceMessage = null;
			}
		}
    });*/
    
	$scope.changePassword = function(data) {
		$scope.confirmPassword(data);
		$scope.submitted = true;
		if($scope.formchangepassword.$valid){
			console.log("in changePassword");
			console.log(data);
			var isValid = true;			
			if(null!=$scope.spaceMessage && ""!=$scope.spaceMessage) {
				isValid = false;
			}
			if(isValid) {
				ChangePasswordService.changePassword(data, function(data, status) { 
					if(data.status == vrmUi.getChangePasswordValue("SUCCESS")) {
						$scope.message = $filter('translate')('changePassword.controller.PASSWORD_CHANGED_MSG');
						$location.url(vrmUi.getChangePasswordValue("NETWORK_CONFIG_URL"));
					}
				}, function(data, status) {
					console.log("Inside error callback for change password for status: "+status+" and data: ");
					console.log(data);
					$scope.message = $filter('translate')('changePassword.controller.CHANGE_PASSWORD_SERVER_ERROR')+data[vrmUi.getChangePasswordValue("KEY_CODE")];
				});
			}
		}
		
	};
	
	//to match new and confirm password
	$scope.confirmPassword = function(data){
		if(undefined !=data && undefined != data.newPassword && undefined != data.confirmPassword) {
			console.log(data.newPassword);
			console.log(data.confirmPassword);
			
			if(data.newPassword!=data.confirmPassword){
				$scope.isvalidclass = 0;
				$scope.spaceMessage = $filter('translate')('changePassword.controller.PASSWORD_NOT_MATCH');	
			} else {
				var isspaceinnewPassword = $scope.spaceregexvalue.exec(data.newPassword);
				var isspaceinconfirmPassword = $scope.spaceregexvalue.exec(data.newPassword);
				if(!isspaceinnewPassword || !isspaceinconfirmPassword){
					$scope.isvalidclass = 0;
					$scope.spaceMessage = $filter('translate')('changePassword.controller.SPACE_NOT_ALLOWED_MSG');
				} else {
					$scope.isValidExpression(data.newPassword);
				}
			}
		}
	};
	
	//to validate the input text
	$scope.isValidExpression = function(textboxvalue){
		var isvalid = $scope.regexvalue.exec(textboxvalue);
		if(!isvalid){
			$scope.isvalidclass = 0;
			$scope.spaceMessage = $filter('translate')('changePassword.controller.VALID_EXPRESSION');
		} else {
			$scope.isvalidclass = 1;
			if (textboxvalue.length < 8) {
				$scope.spaceMessage = $filter('translate')('changePassword.controller.PASSWORD_MINIMUM_LENGTH');
				$scope.isvalidclass = 0;
			 } else {
				 var isidentical = $scope.identicaladjacent.exec(textboxvalue);
				 if(isidentical){
					 $scope.isvalidclass = 0;
					 $scope.spaceMessage = $filter('translate')('changePassword.controller.IDENTICAL_ADJACENT_ERROR');
				 } else {
					 var isdollar = textboxvalue.indexOf("$");
					 var iscap = textboxvalue.indexOf("^");
					 var istilde = textboxvalue.indexOf("~");
					 if(isdollar > 0 || iscap > 0 || istilde > 0){
						 $scope.isvalidclass = 0;
						 $scope.spaceMessage = $filter('translate')('changePassword.controller.SPECIAL_CHAR_ERROR');
					 } else {
						  $scope.spaceMessage = null;
					 }
				 }
			 }
		 }
	};
});