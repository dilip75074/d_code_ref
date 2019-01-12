/**
 * This directive allow to user to access functionality depending upon privilege assigned
 */

vrmUI.directive('ngApplyPrivilege', function($rootScope, PrivilegeService) {
	function applyPrivilege(scope, element, attrs){
		// Get logged in user's privileges
		console.log("Inside ng-apply-privilege directive");
		var appliedPrivileges = new Array();
		var privilegePresent = new Array();

		var privilegesOnElement = attrs.ngApplyPrivilege;
		appliedPrivileges = privilegesOnElement.split(",");

		angular.forEach($rootScope.loggedUserPrivilege, function(privilege, key) {
			angular.forEach(appliedPrivileges, function(privilegeValue,
					key) {
				if (privilege.privilegeKey == privilegeValue.trim()) {
					privilegePresent.push(privilegeValue.trim());
				}
			});
		});

		if (null != privilegePresent && privilegePresent.length > 0) {
			if (element.context.type == "submit") {
				element.attr("disabled", false);
			} else {
					element.bind("click");
			}
		} else {
			if (element.context.type == "submit") {
				element.attr("disabled", true);
			} else {
				element.unbind("click");
				element.css("color", "gray");
			}
		}
	}
	
	return function(scope, element, attrs) {
		if(null==$rootScope.loggedUserPrivilege || $rootScope.loggedUserPrivilege.length==0){
			PrivilegeService.loggedUserPrivileges(function(data){
				if(null!=data.object && data.status=='Success'){
					applyPrivilege(scope, element, attrs);
				}
			},function(data){
				console.log("Error User Privilege");
				console.log(data);
			});
		}else{
			applyPrivilege(scope, element, attrs);
		}
		
	};
});