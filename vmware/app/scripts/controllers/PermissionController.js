/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.controller('PermissionController', function($scope, $route, $rootScope, $modal, PermissionService, $filter, AlertMessaging, $translate) {
    // Get the page context object
    $rootScope.pageContextObject = angular.copy($route.current.data);
    // Translate heading
    var headerKey = $rootScope.pageContextObject.pageTitle;
	$rootScope.pageContextObject.pageTitle = "";
	$translate(headerKey)
        .then(function (translatedValue) {
            $rootScope.pageContextObject.pageTitle = translatedValue;
        });
    
    $scope.showTooltip = [];
    $scope.editingRole = [];
    $scope.errorMsg = "";
    $scope.confirmDelete=[];
    $scope.hideTooltip = [];
    var updatedPermissions = {};
    $scope.rolesObj = {};
    var updatedPermissionsArray = [];
    var originalPermissions = {};
    $scope.showConfirm = [];
    $scope.selectedRoleId = [];
    $scope.isAddDisable = false;
    $scope.editPermission = [];
    $scope.delPermission = [];
    var deletepermissionerror = "";
    
    
    $scope.editButton = function(index, permission) {
        angular.forEach($scope.editPermission, function(flag, ind) {
            if(flag)
            {
                $scope.selectedRoleId[ind] = $scope.permissionList[ind].role.id;
            }

            $scope.editPermission[ind] = false;
        });

        angular.forEach($scope.delPermission, function(flag, ind) {
            $scope.delPermission[ind] = false;
        });

        $scope.isAddDisable = true;
        $scope.editPermission[index] = true;
    };
    
    $scope.deleteButton = function(index){
        angular.forEach($scope.delPermission, function(flag, ind) {
            $scope.delPermission[ind] = false;
        });
        
        angular.forEach($scope.editPermission, function(flag, ind) {
            if(flag == true)
            {
                $scope.selectedRoleId[ind] = $scope.permissionList[ind].role.id;
            }
            $scope.editPermission[ind] = false;
        });
        $scope.isAddDisable = true;
        $scope.delPermission[index] = true;
    };
    
    $scope.toggleTooltip = function(index, e){
        e.stopPropagation();
        if($scope.showTooltip[index]==1){
            $scope.showTooltip[index] = 0; 
        }else{
            $rootScope.hideAllPermissionTooltip();
            $scope.showTooltip[index] = 1; 
        }

        $rootScope.hideAllRoleTooltip();
    };

    $rootScope.hideAllPermissionTooltip = function(){
        angular.forEach($scope.showTooltip, function(value, index){
            $scope.showTooltip[index] = 0;
        });
    };
    
    $rootScope.hidePermissionTooltip = function(e){
        e.stopPropagation();
        angular.forEach($scope.showTooltip, function(value, index){
        if($scope.showTooltip[index]==1)
            $scope.showTooltip[index] = 0;
        });
    };
    
    $scope.showAddPermissionPopup = function() {
        $rootScope.modalInstance = $modal.open({
            templateUrl: vrmUi.permissionControllerValue("ADD_PERMISSION_POPUP"),
            backdrop: vrmUi.permissionControllerValue("BACKDROP"),
            keyboard: false
        });
    };

    $scope.initPage = function(){
        updatedPermissions = {};
        updatedPermissionsArray = [];
        $scope.showConfirm = [];
        $scope.isAddDisable = false;
        $scope.selectedRoleId = [];
        $scope.isAddDisable = false;
        $scope.editPermission = [];
        $scope.delPermission = [];
    };

    $rootScope.fetchAllPermissions = function(){
        $scope.initPage();
        if($rootScope.ShowFullScreenLoading == false){
            $rootScope.ShowFullScreenLoading = true;
            $rootScope.ShowFullScreenLoadingMsg = $filter('translate')('usermanagement.controller.SHOW_FULLSCREEN_LOADING_MSG');
        }
        PermissionService.fetchAllPermissions(function(data){
            $rootScope.ShowFullScreenLoading = false;
            if(data.status == vrmUi.permissionControllerValue("SUCCESS")){
                angular.forEach(data.object, function(val, ind){
                    originalPermissions[val.id] = val.role;
                    $scope.editPermission[ind] = false;
                    $scope.delPermission[ind] = false;
                });

                $scope.permissionList = data.object;
            }
            else
            {
                console.log(data + ' error in fetching permissions');
            }
            
        }, function(data){
        	
        	AlertMessaging.showAlert($filter('translate')('usermanagement.controller.FETCH_PERMISSION_ERROR')+data.code);
        	
        	$rootScope.ShowFullScreenLoading = false;
            console.log(data);
        });
    };

    $scope.fetchAllRoles = function(){
        $scope.rolesObj = {};
        PermissionService.fetchAllRoles(function(data){
            if(data.status == vrmUi.permissionControllerValue("SUCCESS")){
                $rootScope.roleListPermissionPage = data.object;
        
                angular.forEach($rootScope.roleListPermissionPage, function(role, ind){
                    $scope.rolesObj[role.id] = role;
                });
                $scope.editClicked = 1;
            }
            else
            {
                console.log(data + 'error in fetching roles');
            }

        }, function(data){
            AlertMessaging.showAlert($filter('translate')('usermanagement.controller.FETCH_ROLES_ERROR')+data.code);
            console.log(data + 'error in fetching roles');
        });
    };
    
    
    //continuously check change in roleListPermissionPage
    $scope.$watch('roleListPermissionPage', function(newValue, oldValue) {
        
        $scope.rolesObj = {};
        angular.forEach($rootScope.roleListPermissionPage, function(role, ind){
            $scope.rolesObj[role.id] = role;
        });

        angular.forEach(updatedPermissions, function(permission, permId) {
            if(!$scope.rolesObj.hasOwnProperty(permission.roleId))
            {
                angular.forEach($scope.permissionList, function(perm, index){
                    if(perm.role.id == permission.roleId)
                    {
                        perm.role = originalPermissions[permId];
                        $scope.selectedRoleId[index] = perm.role.id;
                    }
                });
                delete updatedPermissions[permId];
            }
        });
    });

    $scope.changedPermission = function(originalPermission, roleId, index){
        var changedPerm = angular.copy(originalPermission);
        changedPerm.role = $scope.rolesObj[roleId];
        $scope.updatePermissions(changedPerm, index, originalPermission);
    };

    $scope.deletePermission = function(selectedPermission, index){
        $rootScope.ShowFullScreenLoading = true;
        $rootScope.ShowFullScreenLoadingMsg = $filter('translate')('usermanagement.controller.SHOW_FULLSCREEN_LOADING_MSG');
        var delPermission = {
            "permissionId" : selectedPermission.id
        };
        console.log('selectedPermission === ' + JSON.stringify(delPermission));
        PermissionService.deletePermission(delPermission, function(data){
            $rootScope.ShowFullScreenLoading = false;
            console.log('deleted');
            $scope.permissionList.splice(index, 1);
            delete originalPermissions[selectedPermission.id];
            $scope.delPermission.splice(index, 1);
            $scope.selectedRoleId.splice(index, 1);
            $scope.isAddDisable = false;
            if(updatedPermissions.hasOwnProperty(selectedPermission.id))
            {
                delete updatedPermissions[selectedPermission.id];
            }
        }, function(data){
            $rootScope.ShowFullScreenLoading = false;
        	if(deletepermissionerror == ""){
                AlertMessaging.showAlert($filter('translate')('usermanagement.controller.DELETE_PERMISSION_ERROR')+data.code);
                deletepermissionerror = ($filter('translate')('usermanagement.controller.DELETE_PERMISSION_ERROR')+data.code); 
                console.log(data+'error in delete');
        	}
        });
    };
    
    $scope.resetall=function(){
        angular.forEach($scope.confirmDelete, function(value, index){
         $scope.confirmDelete[index] = 0;
        });
        
        angular.forEach($scope.hideTooltip, function(value, index){
         $scope.hideTooltip[index] = 1;
        });
     
    };

    $scope.updatePermissions = function(permission, index, originalPermission){
        var updatedObject = {};
        var originalObject = {};
        updatedObject[permission.id] = permission.role.id;
        originalObject[permission.id] = originalPermissions[permission.id].id;
        updatedPermissionsArray = [];

        if(!angular.equals(updatedObject, originalObject))
        {
            updatedPermissions[permission.id] = {
                "entity" : permission.entity,
                "entityType" : permission.entityType,
                "domain" : permission.domain,
                "domainAlias" : permission.domainAlias,
                "roleId" : permission.role.id
            };
            updatedPermissionsArray.push({"entity": permission.entity+"@"+permission.domain, "entityType": permission.entityType, "roleId": permission.role.id});
            $rootScope.ShowFullScreenLoading = true;
            $rootScope.ShowFullScreenLoadingMsg = $filter('translate')('usermanagement.controller.SHOW_FULLSCREEN_LOADING_MSG');
            PermissionService.updatePermissions(updatedPermissionsArray, function(data){
                console.log("success");
                $rootScope.fetchAllPermissions();
                $scope.fetchAllRoles();
            }, function(data){
                $rootScope.ShowFullScreenLoading = false;
                console.log(data + 'error in save');
            	AlertMessaging.showAlert($filter('translate')('usermanagement.controller.UPDATE_PERMISSION_ERROR')+data.code);
                $scope.cancelUpdates(index, originalPermission);
            });
        }
        else
        {
            $scope.editPermission[index] = false;
            $scope.isAddDisable = false;
        }
    };

    $scope.cancelUpdates = function($index, permission){
        if(undefined!=permission && null!=permission){
            $scope.permissionList[$index] = permission;
            $scope.selectedRoleId[$index] = permission.role.id;
        }
           
        $scope.editPermission[$index] = false;
        $scope.delPermission[$index] = false;
        $scope.isAddDisable = false;
    };

    $scope.isNotAdmin = function(permission)
    {
        var currentPermission = permission.entity +"@" + permission.domain;
        return currentPermission.toLowerCase() != vrmUi.permissionControllerValue("EMAIL");
    }
});