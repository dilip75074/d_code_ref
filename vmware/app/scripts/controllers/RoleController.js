/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.controller('RoleController', function($scope, $rootScope, RoleService, PrivilegeService, AlertMessaging, $modal, $filter) {
    $scope.editMode = false;
    $scope.showLoadingRole = true;
    $scope.showLoadingPrivilege = true;
    $scope.displayRoleErrorMsg = false;
    $scope.displayPrivilegeErrorMsg = false;
    $scope.privilegeResponseData = [];
    $scope.selectedRole = {};
    $scope.isDisabled = true;
    $scope.renameRoleArray = [];
    $scope.showConfirmDelete=[];
    $scope.confirmDelete=[];
    $scope.roleSelected = false;
    $scope.roleName = '';
    $scope.newRoleName = '';
    $rootScope.showTooltip = [];
    $scope.editingRole = [];
    $scope.hideTooltip = [];
    $scope.errorMsg = "";
    $scope.isAddDisable = false;
    
    $scope.deleteButton = function(index, roleObj){
		angular.forEach($scope.renameRoleArray, function(value, ind) {
            if(value == true)
            {
                $rootScope.roleList[ind] = angular.copy($rootScope.roleListPermissionPage[ind]);
                $scope.privilegeList = $scope.generatePrivilege($scope.privilegeResponseData);
            }
        });
    	$scope.removeEditMode();
    	$scope.setSelected(roleObj, index);
    	$scope.confirmDelete[index] = 1;
    	$scope.hideTooltip[index] = 0;
    };

    $rootScope.hideAllRoleTooltip = function(){
        angular.forEach($rootScope.showTooltip, function(value, index){
            $rootScope.showTooltip[index] = 0;
        });
    };
    
    /*
     * Toggle tooltip in role
     */
    $scope.toggleTooltip = function(index, e){
    	e.stopPropagation();
    	if($rootScope.showTooltip[index]==1){
    		$rootScope.showTooltip[index] = 0;
    	}else{
    		 $rootScope.hideAllRoleTooltip();
    		$rootScope.showTooltip[index] = 1; 
    	}
        $rootScope.hideAllPermissionTooltip();
    }
    
    /*
     * Hide all tooltip in role
     */
    $rootScope.hideAllTooltip = function(e){
    	e.stopPropagation();
    	angular.forEach($rootScope.showTooltip, function(value, index){
    		if($rootScope.showTooltip[index] == 1)
			$rootScope.showTooltip[index] = 0;
    	});
    }
    
    
     /*
     *  Fetch all roles
     */
    $scope.fetchAllRoles = function(){
        RoleService.fetchRoles(function(data) {
            //AlertMessaging.closeAllAlerts();
            $scope.showLoadingRole = false;
            if (data.status != vrmUi.roleControllerValue("FAILED") && null != data.object) {
                $rootScope.roleList = angular.copy(data.object);
                $rootScope.roleListPermissionPage = angular.copy(data.object);
                if(undefined != $rootScope.roleList[$scope.idSelected])
                {
                    $scope.setSelected($rootScope.roleList[$scope.idSelected], $scope.idSelected);
                }
                
                angular.forEach($rootScope.showTooltip, function(value, index){
            			$rootScope.showTooltip[index] = 0;
            	});
                
                angular.forEach($scope.editingRole, function(value, index){
        			$scope.editingRole[index] = 0;
                });
            } else {
                $scope.displayRoleErrorMsg = true;
                $scope.roleErrorMessage = $filter('translate')('usermanagement.controller.ROLE_ERROR_MESSAGE');
            }
        }, function(data) {
            $scope.showLoadingRole = false;
            $scope.displayRoleErrorMsg = true;
//            AlertMessaging.closeAllAlerts();
        	AlertMessaging.showAlert($filter('translate')('usermanagement.controller.FETCH_ROLES_ERROR')+data.code);
        });
    };
    
    //Generate empty privileges
    $scope.generatePrivilege = function(privilegeList) {

        var tempList = [];
        angular.forEach(privilegeList.object, function(privilege, index){
            
            //create parent privilege
            var flag = true;
            var json = {};
            angular.forEach(tempList, function(tempJson, ind){
                if(flag)
                {
                    if(tempJson.id == privilege.categoryId)
                    {
                        flag = false;
                    }
                }
            });
            if(flag)
            {
                json["id"] = privilege.categoryId;
                json["categoryName"] = privilege.categoryName;
                json["subCat"] = [];
                json["selected"] = false;
                tempList.push(json);
            }

            //create child privilege
            var childPrivilege = {};
            childPrivilege["id"] = privilege.id;
            childPrivilege["name"] = privilege.name;
            childPrivilege["privilegeKey"] = privilege.privilegeKey;
            childPrivilege["description"] = privilege.description;
            childPrivilege["selected"] = false;

            angular.forEach(tempList, function(tempJson, ind){
                if(tempJson.id == privilege.categoryId)
                {
                    tempJson.subCat.push(childPrivilege);
                }
            });
        });

        return tempList;
    };

    /*
     * Fetch all privileges
     */
    $scope.fetchPrivileges = function(){
	    PrivilegeService.fetchPrivileges(function(data) {
//	        AlertMessaging.closeAllAlerts();
	        $scope.showLoadingPrivilege = false;
	        if (data.status != vrmUi.roleControllerValue("FAILED") && null != data.object) {
	            $scope.privilegeResponseData = angular.copy(data);
	            $scope.privilegeList = $scope.generatePrivilege(data);
	            $scope.backupPrivileges = angular.copy($scope.privilegeList);
	        } else {
	            AlertMessaging.showAlert($filter('translate')('usermanagement.controller.PRIVILEGE_ERROR_MESSAGE'));
	        }
	    }, function(data) {
	        $scope.showLoadingPrivilege = false;
	        
//	        AlertMessaging.closeAllAlerts();
	        AlertMessaging.showAlert("Internal error occured in fetching privileges. Please contact the system administrator with the code:"+data.code);
	        
	        console.log("Error while fetching all privilege");
	    });
    };
    
    /*
     * Back to read only mode
     */
    $scope.removeEditMode = function(index){
    	// Rename
    	angular.forEach($scope.renameRoleArray, function(value, index){
    		$scope.renameRoleArray[index] = false;
    	});
    	
    	// Privileges
    	$scope.isDisabled = true;
    	
    	// Buttons
    	angular.forEach($scope.editingRole, function(value, index){
			$scope.editingRole[index] = 0;
    	});
    	
    	angular.forEach($scope.hideTooltip, function(value, index){
			$scope.hideTooltip[index] = 1;
    	});
    	
    	angular.forEach($scope.confirmDelete, function(value, index){
			$scope.confirmDelete[index] = 0;
    	});
    }

    /*
     *  Handle edit click event
     */
    $scope.editButton = function(index, role) {
		angular.forEach($scope.renameRoleArray, function(value, ind) {
            if(value == true)
            {
                $rootScope.roleList[ind] = angular.copy($rootScope.roleListPermissionPage[ind]);
                $scope.privilegeList = $scope.generatePrivilege($scope.privilegeResponseData);
            }
        });
    	$scope.isAddDisable = true;
    	$scope.removeEditMode(index);
    	$scope.setSelected(role, index);
    	$scope.renameRoleArray[index]=true;
    	
    	$scope.editingRole[index] = 1;
    	$scope.isDisabled = false;
    	$scope.hideTooltip[index] = 0;
    };

    /*
     *  Handle add click event
     */
    $scope.addButton = function() {
    	$scope.removeEditMode();
    	$rootScope.privilegeList = angular.copy($scope.backupPrivileges);
        $rootScope.addRoleInstance = $modal.open({
            templateUrl: vrmUi.roleControllerValue("ADD_ROLE"),
            backdrop: vrmUi.roleControllerValue("BACKDROP"),
            keyboard: false,
            size: vrmUi.roleControllerValue("SIZE")
        });
    };
	
    /*
     *  Handle cancel click event
     */

    $scope.resetModes = function(){
//        $scope.editMode = false;
//        $scope.addRole = false;
//        $scope.roleName = '';
//        $scope.newRoleName = '';
//        $scope.isDisabled = true;
//        $scope.roleAndPrivilegesError = "";
//        
//        for(var i in $scope.renameRoleArray){
//            $scope.renameRoleArray[i] = false;
//        }
//        
//        for(var i in $scope.confirmDelete){
//            $scope.confirmDelete[i] = false;
//        }
//        
//        for(var i in $scope.showConfirmDelete){
//            $scope.showConfirmDelete[i] = false;
//        }
    };

    $scope.cancelButton = function() {
        $rootScope.roleList = angular.copy($rootScope.roleListPermissionPage);
        $scope.privilegeList = $scope.generatePrivilege($scope.privilegeResponseData);
        if(undefined != $rootScope.roleList[$scope.idSelected])
        {
            $scope.setSelected($rootScope.roleList[$scope.idSelected], $scope.idSelected);
        }
//        $scope.resetModes();
        $scope.removeEditMode();
        $scope.isAddDisable = false;
        $scope.idSelected = "";
        AlertMessaging.closeAllAlerts();
    };

    $scope.selectPrivileges = function(allPrivileges, selectedPrivileges) {
        angular.forEach(allPrivileges, function(privilege, index){
            angular.forEach(selectedPrivileges, function(selPrivilege,ind){
                if(privilege.id == selPrivilege.categoryId)
                {
                    var flag = true;
                    angular.forEach(privilege.subCat, function(subPriv, i){
                        if(subPriv.id == selPrivilege.id)
                        {
                            subPriv.selected = true;
                        }
                        
                        if(flag && subPriv.selected == false)
                        {
                            flag = false;
                        }
                    });
                    if(flag)
                    {
                        privilege.selected = true;
                    }
                }
            });
        });
        return allPrivileges;
    };

    /*
     * Select row and get privilege list
     */

    $scope.setSelected = function(roleObj, index) {

        $scope.roleSelected = true;
        
        if($scope.editingRole[index] == 1){
        	$scope.isDisabled = false;
        }else{
        	$scope.isDisabled = true;
        }
            
        $scope.idSelected = index;
        var privilegeList = angular.copy($scope.backupPrivileges);
        $scope.privilegeList = $scope.selectPrivileges(privilegeList, roleObj.privileges);
        $scope.selectedRole = roleObj;
        
        if(roleObj.name==vrmUi.roleControllerValue("ADMIN")){
            $scope.isDisabled = true;
        }
        $scope.roleName = roleObj.name;
    };

    $scope.associatePrivilegesToRole = function() {
        var privilegesArray = [];
        angular.forEach($scope.privilegeList, function(parentPrivilege, index){
            angular.forEach(parentPrivilege.subCat, function(privilege, ind){
                if(privilege.selected)
                {
                    var json = {};
                    json["id"] = privilege.id;
                    json["privilegeKey"] = privilege.privilegeKey;
                    json["name"] = privilege.name;
                    json["description"] = privilege.description;
                    json["categoryName"] = parentPrivilege.categoryName;
                    json["categoryId"] = parentPrivilege.id;
                    privilegesArray.push(json);
                }
            });
        });

        $scope.selectedRole["privileges"] = privilegesArray;

    };

    $scope.editParentPrivilege = function(privilege, $event){
        angular.forEach(privilege.subCat, function(item, index){
            if($event.target.checked == true){
                privilege.selected = true;
                item.selected = true;
            }else{
                privilege.selected = false;
                item.selected = false;
            }
        });
        $scope.associatePrivilegesToRole();
    };

    $scope.editChildPrivilege = function(parentPrivilege, $event, privilege) {
        if($event.target.checked == true) {
            privilege.selected = true;
        }
        else
        {
            privilege.selected = false;
            parentPrivilege.selected = false;
        }

        var flag = true;
        angular.forEach(parentPrivilege.subCat, function(item, index){
            if(flag && item.selected == false)
            {
                flag = false;
            }
        });
        if(flag)
        {
            parentPrivilege.selected = true;
        }

        $scope.associatePrivilegesToRole();
    };

    $scope.checkIsRoleValid = function(roleName, $index){
        var flag = true;
        $scope.errorMsg = "";
        if(roleName == "")
        {
        	$scope.errorMsg = $filter('translate')('usermanagement.controller.INVALID_ERROR_MESSAGE');
            AlertMessaging.closeAllAlerts();
            if(undefined!=$index){
            	AlertMessaging.showAlert($scope.errorMsg);
            }
            
            flag = false;
        }
        else
        {
            angular.forEach($rootScope.roleList, function(roleObj, ind){
                if($index != ind)
                {
                    if(flag && roleObj.name.toLowerCase() == roleName.toLowerCase())
                    {
                    	$scope.errorMsg = "Role '"+roleName.toUpperCase()+$filter('translate')('usermanagement.controller.ALREADYEXISTS_ERROR_MESSAGE');
                        AlertMessaging.closeAllAlerts();
                        if(undefined!=$index){
                        	AlertMessaging.showAlert($scope.errorMsg);
                        }
                        flag = false;
                    }                    
                }
            });
        }
        return flag;
    };

    /*
     * Submit roles
     */
    $scope.submit = function() {
    	var roleListValue = $rootScope.roleList;
        var requestJsonList = [];
        var isValidRole = true;
        
        if(null!=roleListValue){
        	
        	for(var i in roleListValue){
        		if(roleListValue[i].name!=vrmUi.roleControllerValue("ADMIN") && roleListValue[i].name!=""){
        			requestJsonList.push(roleListValue[i]);
        		}
        	}

            var flag = true;
            angular.forEach($rootScope.roleList, function(obj, ind){
                if(flag)
                {
                    flag = $scope.checkIsRoleValid(obj.name, ind);
                }
            });
            
        	var isNotChanged = angular.equals($rootScope.roleList, $rootScope.roleListPermissionPage);
        	
        	if(flag == true && isNotChanged==false){
        		$rootScope.ShowFullScreenLoading = true;
            	$rootScope.ShowFullScreenLoadingMsg = $filter('translate')('usermanagement.controller.SAVE_ROLE');
            	
        		//console.log(JSON.stringify(requestJsonList));
    	        RoleService.saveRoles(requestJsonList, function(data) {
    	        	AlertMessaging.closeAllAlerts();
    	        	
    	        	$rootScope.ShowFullScreenLoading = false;
    	        	$scope.resetModes();
    	        	$scope.roleAndPrivilegesError = "";
    	            console.log("Roles saved successfully");
    	            $scope.showLoadingRole = true;
    	            $scope.fetchAllRoles();
    	            
    	            // Reload user's privileges
    	            //$rootScope.fetchUserPrivileges();
    	            
    	            // Reload screen to fetch updated privilege data
    	            location.reload();
    	            
    	        }, function(data) {
    	        	$rootScope.ShowFullScreenLoading = false;
    	        	//$scope.roleAndPrivilegesError = "Internal error occured in saving roles. Please contact the system administrator with the code:"+data.code;
    	        	$rootScope.roleList = angular.copy($rootScope.roleListPermissionPage);
    	        	
    	        	AlertMessaging.closeAllAlerts();
    	        	
    	        	AlertMessaging.showAlert($filter('translate')('usermanagement.controller.SAVING_ROLE_ALERT')+data.code);
    	    		
    	        	//console.log("Cannot save roles");
    	        });
        	}
           	else if(flag == true && isNotChanged==true){
           		$scope.resetModes();
           		AlertMessaging.closeAllAlerts();
           	}
        }

        $scope.removeEditMode();
        $scope.isAddDisable = false;
    };
    
    /*
     * Add new roles
    */
    $scope.newRole = function(){
        if($scope.checkIsRoleValid($scope.newRoleName))
        {
            AlertMessaging.closeAllAlerts();
            var json = {};
            json["name"]=$scope.newRoleName;
            json["description"]= "";
            json["privileges"] = [];
            $rootScope.roleList.push(json);
            $scope.editMode = true;
//            $scope.setSelected($scope.roleList[$scope.roleList.length-1], $scope.roleList.length-1);
            $scope.selectedRole = json;
            $scope.associatePrivilegesToRole();
            $scope.submit();
            $scope.cancel();
        }
        
//        $scope.roleName = "";
//        $scope.newRoleName = "";
    };

    /*
     * Remove role
     */
    $scope.removeRole = function(roleObj, index){
    	 if($scope.checkIsRoleValid(roleObj.name, index))
         {
	        if("undefined"!=roleObj.id && null!=roleObj.id){
	            RoleService.removeRole(roleObj.id, function(data){
                    AlertMessaging.closeAllAlerts();
	                console.log("Delete role successfully");
	                $scope.removeRoleFromList(roleObj);
	                $scope.roleAndPrivilegesError = "";
                    $scope.showConfirmDelete.splice(index,1);
                    $scope.confirmDelete.splice(index,1);
	            }, function(data){
	                AlertMessaging.closeAllAlerts();
	                AlertMessaging.closeAllAlerts();
	                
                	if(data.hasOwnProperty("message") && data.message == $filter('translate')('usermanagement.controller.ROLE_ASSOCIATED_TO_PERMISSION_ERROR_MSG'))
                    {
                        AlertMessaging.showAlert($filter('translate')('usermanagement.controller.ROLE_ASSOCIATED_TO_PERMISSION_ERROR_MSG'));
                    }
                    else
                    {
                        AlertMessaging.showAlert($filter('translate')('usermanagement.controller.DELETE_ROLE_ERROR')+data.code);                        
                    }
	                
	                
	                //$scope.roleAndPrivilegesError = "Internal error occured in delete role. Please contact the system administrator with the code:"+data.code;
	                //console.log("Cannot delete role");
	            });
	        }else{
	            $scope.confirmDelete[index] = true;
	            $scope.showConfirmDelete[index] = false;
	            $scope.removeRoleFromList(roleObj);
	        } 
	        
	        $scope.removeEditMode();
         }
    };
    
    /*
     * Remove role form $scope.roleList
     */
    $scope.removeRoleFromList = function(roleObj){
        var tempRoleList = $rootScope.roleList;
        var persistRoleList = [];
        
        for(var i in tempRoleList){
            console.log(tempRoleList[i].name+"------"+roleObj.name);
            if(tempRoleList[i].name!=roleObj.name){
                persistRoleList.push(tempRoleList[i]);
            }
        }
        
        $rootScope.roleList = "";
        $rootScope.roleList =[];
        
        $rootScope.roleList = persistRoleList;
        var tempList = [];
        angular.forEach($rootScope.roleListPermissionPage, function(obj, ind){
            if(obj.id != roleObj.id)
            {
                tempList.push(obj);
            }
        });
        $rootScope.roleListPermissionPage = angular.copy(tempList);
//        console.log(JSON.stringify($scope.roleList));
        if(undefined != $rootScope.roleList[$scope.idSelected])
        {
            $scope.setSelected($rootScope.roleList[$scope.idSelected], $scope.idSelected);
        }
        else
        {
            $scope.setSelected($rootScope.roleList[$scope.idSelected-1], $scope.idSelected-1);            
        }
    };
    
    /*
     * Rename role
     */
    $scope.rename = function(roleObj, newName, $index){
        if($scope.checkIsRoleValid(newName, $index))
        {
            AlertMessaging.closeAllAlerts();
            var tempRoleList = $rootScope.roleList;
            for(var i in $scope.roleList){
                if(JSON.stringify($rootScope.roleList[i])==JSON.stringify(roleObj)){
                    $rootScope.roleList[i].name = newName;
                }
            }
        }
    };
    
    $scope.cancel = function(){
    	$scope.removeEditMode();
    	$rootScope.addRoleInstance.close();
    };
});