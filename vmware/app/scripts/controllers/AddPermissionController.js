/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.controller('AddPermissionController', function($scope, $rootScope, AddPermissionService, PermissionService, $filter) {
	
	$scope.showList = false;
	$scope.typeList = [vrmUi.getAddPermissionValue("USER_TYPE"), vrmUi.getAddPermissionValue("GROUP_TYPE")];
	$scope.selectedType = $scope.typeList[0];
	$scope.filterString = '';
	$scope.usersList = '';
	$scope.selectedRolePrivileges = [];
	
	$scope.selectedUserDetails = {}; $scope.allUserDetails = {};
	$scope.displayToolTip = -1;
	$scope.showListLoading = false;
	
	$scope.roleList = [];
	$scope.inValidDomain = false;
	
	//cancel button click event handler
	$scope.cancel = function() {
        $rootScope.modalInstance.close();
    };
    
    //fetching the domains list
    $scope.fetchDomainList = function() {
    	console.log("Inside fetchDomainList...");
    	
    	$scope.domainList = [$filter('translate')('addpermission.controller.SHOW_LOADING')];
    	$scope.selectedDomain = $scope.domainList[0];
    	
    	AddPermissionService.fetchDomainList(function(data){
    		$scope.domainList = [];
    		
    		if(data.status == vrmUi.getAddPermissionValue("SUCCESS")) {
    			$scope.domainList = data.object;
    			$scope.selectedDomain = $scope.domainList[0];
    		}
    	}, function(data){
    		$scope.domainList = [$filter('translate')('addpermission.controller.FETCH_DOMAINS')];
    		$scope.selectedDomain = $scope.domainList[0];
    	});
    };
    
    $scope.fethRoleList = function(){
    	AddPermissionService.fetchRoleList(function(data){
    		if(data.status == vrmUi.getAddPermissionValue("SUCCESS")) {
    			$scope.roleList = data.object;
    			var obj = {
    	    	        "id": -1,
    	    	        "name": "Select",
    	    	        "description": "Select",
    	    	        "privileges": []
    	    	    };
    			$scope.roleList.push(obj);
    			
    			$scope.selectedRoleId = -1;
			} else {
				
			}
		}, function(data){
			
		});
    };
    
    $scope.fetchUsers = function(){
    	console.log("Inside fetchUsers...");	
    	
    	//console.log("=====  ::" + $scope.selectedDomain);
    	if($scope.selectedDomain != $filter('translate')('addpermission.controller.SHOW_LOADING')){
    		$scope.inValidDomain = false;
    		$scope.displayType = $scope.selectedType;
        	$scope.displaySelectedDomain = $scope.selectedDomain;
        	
        	if($scope.selectedType == vrmUi.getAddPermissionValue("USER_TYPE")){
        		$scope.displayType = vrmUi.getAddPermissionValue("DISPLAY_USER");
        	} else {
        		$scope.displayType = vrmUi.getAddPermissionValue("DISPLAY_GROUP");
        	}
        	
        	//showing full screen loading page
        	$rootScope.ShowFullScreenLoading = true;
            $rootScope.ShowFullScreenLoadingMsg = $filter('translate')('addpermission.controller.SHOW_FULLSCREEN_LOADING_MSG');
        	
        	//if($scope.filterString.length >= 3){
        		$scope.listSuccessErrorMsg = $filter('translate')('addpermission.controller.SHOW_LOADING');
        		$scope.showListLoading = true;
        		
        		var requestData = {"domain":$scope.selectedDomain};
            	var apiCall;
            	if($scope.selectedType == vrmUi.getAddPermissionValue("USER_TYPE")){
            		apiCall = vrmUi.getValue("usersAPI");
            		requestData.userSearchCriteria = $scope.filterString;
            	} else {
            		apiCall = vrmUi.getValue("groupsAPI");
            		requestData.groupSearchCriteria = $scope.filterString;
            	}
            	
            	//console.log(JSON.stringify(requestData));
            	
            	AddPermissionService.fetchUsers(vrmUi.getValue("fetchUsersAPI")+$scope.selectedDomain+'/'+apiCall, function(data){
            		//console.log("Users List :: ");
        			//console.log(JSON.stringify(data));
            		if(data.status == vrmUi.getAddPermissionValue("SUCCESS")) {
            			$rootScope.ShowFullScreenLoading = false;
            	        $rootScope.ShowFullScreenLoadingMsg = '';
            			
            			$scope.showList = true;
            			$scope.showListLoading = false;
            			
            			/*var isNewUser = true;
            			if($scope.usersList.length > 0){
            				for(var i=0 ; i<data.object.length ; i++){
            					newUser = false;
            					for(var j=0 ; j<$scope.usersList.length ; j++){
            						if(data.object[i] == $scope.usersList[j]){
            							isNewUser = false;
            							break;
            						}
            					}
            					
            					if(isNewUser == true){
            						$scope.usersList.push(data.object[i]);
            					}
            				}
            			} else {
            				$scope.usersList = data.object;
            			}*/
            			
            			$scope.usersList = data.object;
            			/*var len=data.object.length;
            			console.log("user list================");
            			//console.log(JSON.stringify(data));*/
            			$scope.fetchAllPermissions();
            			
            			//loop through all the users and add its object into the $scope.selectedUserDetails 
                        for(var i=0 ; i<data.object.length ; i++){
                         //console.log($scope.usersList[i]);
                         $scope.allUserDetails[data.object[i]] = {
                        		 "entity" : data.object[i],
                        		 "entityType" : $scope.selectedType,
                        		 "roleId" : $scope.selectedRoleId
                         };
                         
                         /*$scope.selectedUserDetails[data.object[i]] = {
                        		 "entity" : data.object[i],
                        		 "entityType" : $scope.selectedType,
                        		 "roleId" : $scope.selectedRoleId
                         };*/
                        }
            	    	
            	    	//console.log("selectedUserDetails ::");
            	    	//console.log(JSON.stringify($scope.selectedUserDetails));
        			} else {
        				$scope.showList = false;
        			}
        		}, function(data){
        			console.log("Error in fetching users....");
        			$scope.listSuccessErrorMsg = $filter('translate')('addpermission.controller.FETCH_USER_ERROR');
        		}, {criteria: $scope.filterString});
        	/*} else {
        		
        	}*/
    	} else {
    		//alert("Please select domain first.");
    		$scope.inValidDomain = true;
    		$scope.errMsg = $filter('translate')('addpermission.controller.SELECT_DOMAIN');
    	}
    	
    	
    };	
    
    
    $scope.fetchAllPermissions = function(){ 
        PermissionService.fetchAllPermissions(function(data){         
            if(data.status == vrmUi.getAddPermissionValue("SUCCESS")){
                $scope.permissionList = data.object;
                
                for(var i=0 ; i<$scope.permissionList.length ; i++){
                	for(var j=0;j<$scope.usersList.length;j++){
                		var obj = $scope.permissionList[i];
                		var permissionListUser = obj.entity+'@'+obj.domain;
                		console.log(permissionListUser.toLowerCase() +"==="+ $scope.usersList[j].toLowerCase());
                		if($scope.usersList[j].toLowerCase() == permissionListUser.toLowerCase()){
                			//delet that user from usersList
                			$scope.usersList.splice(j,1);
                		}
                	}
                }                 
            }  
        });
     };
    
    
    /*$scope.typeChange = function(){
    	console.log($scope.selectedType);
    };
    
    $scope.domainChange = function(){
    	console.log($scope.selectedDomain);
    };*/
    
    $scope.submitUserDetails = function(){
    	
    	 //1st convert the selectedUserDetails json object to array of object
    	 $scope.isInvalidUserRole = false;
    	 var confirmUsers = [];
         angular.forEach($scope.selectedUserDetails, function(value, key) {
             if(value.roleId == -1){
        	   $scope.isInvalidUserRole = true;
        	   $scope.errMsg = $filter('translate')('addpermission.controller.SELECT_ROLE');
           } 
           this.push(value);
         }, confirmUsers);
         
         if(confirmUsers.length > 0){
        	if($scope.isInvalidUserRole == false){
        		$rootScope.ShowFullScreenLoading = true;
             	$rootScope.ShowFullScreenLoadingMsg = $filter('translate')('addpermission.controller.SHOW_FULLSCREEN_LOADING_MSG');
             	
             	AddPermissionService.submitUserDetails(confirmUsers, function(data){
         			if(data.status == vrmUi.getAddPermissionValue("SUCCESS")) {
         				$rootScope.ShowFullScreenLoading = false;
         				$scope.cancel();
        			} else {
        				
        			}
         			$rootScope.fetchAllPermissions();
        		 }, function(data){
        			$scope.cancel(); 
    	            /*AlertMessaging.closeAllAlerts();
    				AlertMessaging.showAlert($filter('translate')('addpermission.controller.SAVE_ERROR_ALERT')+data.code);*/
        			$rootScope.ShowFullScreenLoading = false;
        		 });
        	}
         } else {
        	 $scope.cancel();
         }
    };
    
    /*$scope.updateRole = function(user, roleId){
    	//$scope.selectedUserDetails[user].roleId = roleId;
    	$scope.allUserDetails[user].roleId = roleId;
    	
    	if(undefined != $scope.selectedUserDetails[user]){
    		$scope.selectedUserDetails[user].roleId = roleId;
    	}
    	console.log(JSON.stringify($scope.selectedUserDetails));
    };*/
    
    $scope.updateRole = function(user, roleId){
    	if(roleId != -1){
    		$scope.selectedUserDetails[user] = {
           		 "entity" : user,
           		 "entityType" : $scope.selectedType,
           		 "roleId" : roleId
            };
    		$scope.showConfirm = true;
    	} else{
    		delete($scope.selectedUserDetails[user]);
    		
    		var count = 0;
    		angular.forEach($scope.selectedUserDetails, function(value, key) {
		       count++;
		     });
    		 
    		if(count==0){
    			$scope.showConfirm = false;
    		}
    	}
    	
    	//console.log(JSON.stringify($scope.selectedUserDetails));
    };
    
    $scope.confirmDelete = function(user){
    	delete($scope.selectedUserDetails[user]);
    	//console.log(JSON.stringify($scope.selectedUserDetails));
    };
    
    $scope.showRolePrivileges = function(roleId, index){
    	//$scope.selectedRolePrivileges = [];
    	$scope.selectedRolePrivilegesHtml = '<ul>';
    	
    	//1st get the role object from roleId
    	for(var i=0 ; i<$scope.roleList.length ; i++){
    		if($scope.roleList[i].id == roleId){
    			if($scope.roleList[i].privileges.length>0)
				{
    			for(var j=0 ; j<$scope.roleList[i].privileges.length ; j++){
    				
    				console.log('Admin');
    				//$scope.selectedRolePrivileges.push($scope.roleList[i].privileges[j].description);
    				$scope.selectedRolePrivilegesHtml += '<li style="padding:0px; text-align:left;">'+$scope.roleList[i].privileges[j].description+'</li>';
    			  console.log($scope.roleList[i].privileges[j].description);
    					}
    			
    			}
    			else {
    				$scope.selectedRolePrivilegesHtml += '<li style="padding:0px; text-align:left;">'+$filter('translate')('addpermission.controller.PRIVILEGES_NOT_ASSIGNED')+'</li>';
       			 
    			}
    		}
    		
    	}
    	$scope.selectedRolePrivilegesHtml += '</ul>';
    };
    
    $scope.showToolTip = function(index){
    	if(index == $scope.displayToolTip){
    		$scope.displayToolTip = -1;
    	} else {
    		$scope.displayToolTip = index;
    	}
    };
    
    $scope.hideToolTip = function(){
    	console.log("body click....");
    	//$scope.displayToolTip = -1;
    	//if($scope.displayToolTip != false){
    		//$scope.displayToolTip = false;
    	//}
    };
    
    $scope.updateSelection = function($event, user){
    	var checkbox = $event.target;
    	var action = (checkbox.checked ? vrmUi.getAddPermissionValue("ADD_ACTION") : vrmUi.getAddPermissionValue("REMOVE_ACTION"));
    	
    	console.log(user);
    	if(action == 'add'){
    		$scope.selectedUserDetails[user] = {
           		 "entity" : user,
           		 "entityType" : $scope.selectedType,
           		 "roleId" : $scope.allUserDetails[user].roleId
            };
    	} else{
    		delete($scope.selectedUserDetails[user]);
    	}
    	
    	console.log(JSON.stringify($scope.selectedUserDetails));
    };
    
    $scope.fetchDomainList();
    $scope.fethRoleList();
});