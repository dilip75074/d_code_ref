/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.controller('SettingController', function($scope, $route, SettingService, AlertMessaging, $rootScope, $filter, $translate) {
	// Get the page context object
	$rootScope.pageContextObject = angular.copy($route.current.data);
	// Translate heading
	var headerKey = $rootScope.pageContextObject.pageTitle;
	$rootScope.pageContextObject.pageTitle = "";
	$translate(headerKey)
        .then(function (translatedValue) {
            $rootScope.pageContextObject.pageTitle = translatedValue;
        });
	
	//using pageNumber for pagination 
	$scope.pageNumber = 1;
	$scope.editedThresholdList  = [];
	$scope.flag = 1;	
	$scope.showDisableDone = 0;
	$scope.regexvalue = /^\(?([0-9]*)\)?$/;
	$scope.isvalidclass = 1;
	$scope.unit = vrmUi.settingsControllerValue("DEGREE_F");
	$scope.hideTooltip = [];
	$scope.showTooltip = [];
	$scope.deleteThresholdFlags = [];
	$scope.editThresholdFlags = [];
	$scope.newThreshold = {};
	/**
	 * Method to fetch the threshold categories
	 * 
	 * @return
	 */
	$scope.toggleTooltip = function(index, e){
        e.stopPropagation();
        if($scope.showTooltip[index]==1){
            $scope.showTooltip[index] = 0; 
        } else {
        	$rootScope.hideAllSettingTooltip();
            $scope.showTooltip[index] = 1; 
        }
    };

	$rootScope.hideAllSettingTooltip = function(){
        angular.forEach($scope.showTooltip, function(value, index){
            $scope.showTooltip[index] = 0;
        });
	};
	
    $rootScope.hideSettingTooltip = function(e){
        e.stopPropagation();
        angular.forEach($scope.showTooltip, function(value, index){
			if($scope.showTooltip[index]==1)
				$scope.showTooltip[index] = 0;
        });
    };
    
	$scope.clearTextboxValue = function(){
	    console.log("Cleared");
		$scope.newThreshold.value = "";
	};
	
	$scope.isValidExpression = function(datatype,textboxvalue){
		if(datatype==vrmUi.settingsControllerValue("FLOAT")){
			 $scope.regexvalue = /^\(?([0-9]+)\)?[.]([0-9]{1,2})$/;
		}
		if(datatype==vrmUi.settingsControllerValue("INTEGER")){
			$scope.regexvalue = /^\(?([0-9]*)\)?$/;
		}
		if(datatype==vrmUi.settingsControllerValue("BOOLEAN")){
			$scope.regexvalue = /^(true|false)$/i;
		}
		var isvalid = $scope.regexvalue.exec(textboxvalue);
		if(!isvalid){
			$scope.isvalidclass = 0;
		} else {
			$scope.isvalidclass = 1;
		}
	};
	
	$scope.setdefault = function(data){
		if(data==vrmUi.settingsControllerValue("BOOLEAN")){
			$scope.newThreshold.units='null';
			//$scope.unit='null';
		} else {
			$scope.newThreshold.units=vrmUi.settingsControllerValue("DEGREE_F");
			//$scope.unit='DegreesF';
		}
		//console.log($scope.unit);	
	};
		
	$scope.fetchThresholdcategories = function(){
		$rootScope.ShowFullScreenLoading = true;
		$rootScope.ShowFullScreenLoadingMsg = $filter('translate')('settings.controller.SHOW_FULLSCREEN_LOADING_MSG');	
		SettingService.fetchThresholdcategories(function(data){
			$scope.categoryList = data.object;
			$scope.fetchTypes();
		}, function(data){
			$rootScope.ShowFullScreenLoading = false;
			$scope.flag = 0;
			AlertMessaging.closeAllAlerts();
			AlertMessaging.showAlert($filter('translate')('settings.controller.FETCH_THRESHOLD_CATEGORIES')+data.code);
		});
	};
	
	/**
	 * Method to fetch the threshold types
	 * 
	 * @return
	 */
	$scope.fetchTypes = function(){
		SettingService.fetchTypes(function(data){
			$scope.typeList = data.object;
			$scope.fetchThresholdList($scope.pageNumber);
		}, function(data){
			$rootScope.ShowFullScreenLoading = false;
			$scope.flag = 0;
			AlertMessaging.closeAllAlerts();
			AlertMessaging.showAlert($filter('translate')('settings.controller.FETCH_TYPES_ALERT')+data.code);
		});
	};
	
	/**
	 * Method to fetch the threshold list
	 * 
	 * @param pagaeNumber
	 * @return
	 */
	$scope.fetchThresholdList = function(pageNumber, successMsg){
		if(pageNumber == 1){
			$scope.pageNumber = 1;
			$scope.thresholdList = [];
			$scope.editThresholdFlags = [];
			$scope.deleteThresholdFlags = [];
		}	
		SettingService.fetchThresholdList(pageNumber, function(data){
			$rootScope.ShowFullScreenLoading = false;
			$scope.showErrorMsg = false;
			if(undefined!=data.object || null!=data.object){
				if($scope.thresholdList.length > 0){
	    			for(var i=0 ; i<data.object.length ; i++){
	    				$scope.thresholdList.push(data.object[i]);
	    				$scope.deleteThresholdFlags.push(false);
	    				$scope.editThresholdFlags.push(false);
	    			}
	    		} else {
	    			$scope.thresholdList = data.object;
	    			for(var i = 0; i < $scope.thresholdList.length; i++)
	    			{
	    				$scope.deleteThresholdFlags[i] = false;
	    				$scope.editThresholdFlags[i] = false;
	    			}
	    		}
			} else {
				$scope.editModeSelected = 0;
			}
			$scope.thresholdListBackUp = angular.copy($scope.thresholdList);
			if(null != successMsg && successMsg.length > 0){
				AlertMessaging.closeAllAlerts();
				AlertMessaging.showAlert(successMsg, vrmUi.settingsControllerValue("SUCCESS"));
			}
		}, function(data){
			$rootScope.ShowFullScreenLoading = false;
			AlertMessaging.closeAllAlerts();
			AlertMessaging.showAlert($filter('translate')('settings.controller.FETCH_THRESHOLD_LIST')+data.code);
		});
	};
	
	/**
	 * Method to update the threshold status ON/OFF
	 * 
	 * @param thresholdObject
	 * @return
	 */
	$scope.onOffThreshold = function(thresholdObj, flag, index){
		$rootScope.ShowFullScreenLoading = true;
		$rootScope.ShowFullScreenLoadingMsg = $filter('translate')('settings.controller.SHOW_FULLSCREEN_LOADING_MSG');	
		var json = angular.copy(thresholdObj);
		json.enable = flag;
		SettingService.OnOffThreshold(json, function(data){
			$rootScope.ShowFullScreenLoading = false;
			AlertMessaging.closeAllAlerts();
			$scope.thresholdList[index] = json;
			$scope.fetchThresholdList($scope.pageNumber, data.message);
		}, function(data){
			$rootScope.ShowFullScreenLoading = false;
			AlertMessaging.closeAllAlerts();
			AlertMessaging.showAlert($filter('translate')('settings.controller.SAVE_UPDATE_THRESHOLD_ALERT')+data.code);
		});
	};
	
	/**
	 * Method to check threshold already exists
	 * 
	 * @param thresholdObject
	 * @return
	 */	
	$scope.checkEntryAlreadyExists = function(thresholdObj, index){
		var flag = false;
		angular.forEach($scope.thresholdList, function(object, ind){
			if(!flag && index != ind){
				if(thresholdObj.category == object.category && thresholdObj.type == object.type){
					flag = true;
				}
			}
		});
		return flag;
	};

	/**
	 * Method to edit/add the threshold
	 * 
	 * @param thresholdObject
	 * @return
	 */	
	$scope.addEditThreshold = function(thresholdObj, index){
		$rootScope.ShowFullScreenLoading = true;
		$rootScope.ShowFullScreenLoadingMsg = $filter('translate')('settings.controller.SHOW_FULLSCREEN_LOADING_MSG');
		var isValidData = false;
		var isValidDataType = false;
		var isAlreadyExist = false;
		var isEqual = false;
		var tempThreshold = thresholdObj;
		if(undefined != index){
			tempThreshold = thresholdObj[index];
		}
		if($scope.addModeSelected == 1){
			isValidDataType = $scope.checkValueDataType(thresholdObj.value, thresholdObj.dataType);
			isAlreadyExist = $scope.checkEntryAlreadyExists(thresholdObj);
		} else {
			isEqual = angular.equals($scope.thresholdList, $scope.thresholdListBackUp);
			if(!isEqual){
				for(var i=0 ; i<$scope.thresholdList.length ; i++){
					isValidDataType = $scope.checkValueDataType($scope.thresholdList[i].value, $scope.thresholdList[i].dataType);
					isAlreadyExist = $scope.checkEntryAlreadyExists($scope.thresholdList[i], i);
					if(!isValidDataType || isAlreadyExist)
						break;
				}
			} else {
				$scope.addModeSelected = 0;
				$scope.editModeSelected = 0;
				$scope.otherModeSelected = 0;
				$scope.editThresholdFlags[index] = false;		
				$rootScope.ShowFullScreenLoading = false;
				$scope.pageNumber = 1;
				$scope.newThreshold.value = '';
				$scope.isvalidclass = 1;
				
				//clearing the editedThresholdList
				$scope.editedThresholdList  = [];
				$scope.showDisableDone = 0;
			}
		}
		if($scope.addModeSelected == 1 || ($scope.addModeSelected == 0 && !isEqual)){
			if(isValidDataType && !isAlreadyExist){
				isValidData = true;
			} else if(!isValidDataType && isAlreadyExist){
				$rootScope.ShowFullScreenLoading = false;
				AlertMessaging.closeAllAlerts();
				AlertMessaging.showAlert($filter('translate')('settings.controller.INVALID_ERROR_MESSAGE'));
			} else if(!isValidDataType){
				$rootScope.ShowFullScreenLoading = false;
				AlertMessaging.closeAllAlerts();
				var regex = /^\(?([0-9]+)\)?[.]([0-9]{3,})$/;
				if(tempThreshold.dataType == vrmUi.settingsControllerValue("FLOAT") && regex.exec(tempThreshold.value)) {
			 		AlertMessaging.showAlert($filter('translate')('settings.controller.MAX_TWO_DIGITS_ALLOWED'));
			 	} else {
					AlertMessaging.showAlert($filter('translate')('settings.controller.INVALID_DATATYPE_ERROR_MESSAGE'));
			 	}				
			} else if(isAlreadyExist){
				$rootScope.ShowFullScreenLoading = false;
				AlertMessaging.closeAllAlerts();
				AlertMessaging.showAlert($filter('translate')('settings.controller.ALREADY_EXISTS_ERROR_MESSAGE'));
			}
		}
		if(isValidData){
			$scope.showErrorMsg = false;
			if(tempThreshold.dataType == vrmUi.settingsControllerValue("FLOAT") || tempThreshold.dataType == vrmUi.settingsControllerValue("INTEGER")) {
				tempThreshold.value = Number(tempThreshold.value) + "";
				if(tempThreshold.dataType == vrmUi.settingsControllerValue("FLOAT") && tempThreshold.value.split('.').length == 1)
				{
					tempThreshold.value += ".0";
				}
			}
			else if(tempThreshold.dataType == vrmUi.settingsControllerValue("BOOLEAN")) {
				tempThreshold.value = tempThreshold.value.toUpperCase();
			}
			
			SettingService.addEditThreshold(thresholdObj, function(data){
				$scope.addModeSelected = 0;
				$scope.editModeSelected = 0;
				$scope.otherModeSelected = 0;
				$rootScope.ShowFullScreenLoading = false;
				$scope.pageNumber = 1;
				$scope.fetchThresholdList($scope.pageNumber, data.message);
				$scope.newThreshold.value = '';
				//clearing the editedThresholdList
				$scope.editedThresholdList  = [];
				$scope.showDisableDone = 0;
			}, function(data){
				$rootScope.ShowFullScreenLoading = false;
				AlertMessaging.closeAllAlerts();
				AlertMessaging.showAlert($filter('translate')('settings.controller.SAVE_UPDATE_THRESHOLD_ALERT')+data.code);
				$scope.newThreshold.value = '';
			});
		}
	};
	
	/**
	 * Method to delete the threshold
	 * 
	 * @param thresholdId
	 * @return
	 */
	$scope.deleteThreshold = function(thresholdId, index){
		$rootScope.ShowFullScreenLoading = true;
		$rootScope.ShowFullScreenLoadingMsg = $filter('translate')('settings.controller.SHOW_FULLSCREEN_LOADING_MSG');
		$scope.otherModeSelected = 0;
		SettingService.deleteThreshold(thresholdId, function(data){
			$rootScope.ShowFullScreenLoading = false;
			$scope.editModeSelected = 1;
			delete $scope.deleteThresholdFlags[index];
			$scope.pageNumber = 1;
			$scope.fetchThresholdList($scope.pageNumber, data.message);
			$scope.showDisableDone = 0;
		}, function(data){
			$rootScope.ShowFullScreenLoading = false;
			AlertMessaging.closeAllAlerts();
			AlertMessaging.showAlert($filter('translate')('settings.controller.DELETE_THRESHOLD_ALERT')+data.code);
		});
	};
	
	$scope.changeModel = function(index, dataType){
		if(dataType == vrmUi.settingsControllerValue("BOOLEAN")){
			$scope.thresholdList[index]['units'] = 'null';
		}
	};

	$scope.editThreshold = function(thresholdId, attributeName, value, index){
		for(var i=0 ; i<$scope.thresholdList.length ; i++){
			if($scope.thresholdList[i].id == thresholdId){
				$scope.thresholdList[i][attributeName] = value;
			}
		}
		if(index != undefined){
			$scope.changeModel(index, value);
		}
		//console.log(JSON.stringify($scope.thresholdList));
	};
	
	$scope.resetThresholdList = function(){
		$scope.isvalidclass = 1;
		$scope.thresholdList = $scope.thresholdListBackUp;
		$scope.thresholdListBackUp = angular.copy($scope.thresholdList);
		AlertMessaging.closeAllAlerts();
	};
	
	/**
	 * Method to check the value and selected dataType
	 * 
	 * @param value, dataType
	 * @return true/false
	 */
	$scope.checkValueDataType = function(value, dataType){
		if(null != value && value != '' && $scope.isvalidclass==1){
			/*if(dataType == vrmUi.settingsControllerValue("INTEGER")){
				return !isNaN(value) && (value == parseInt(value)) && (value.split(".").length==1); 
			} else if(dataType == vrmUi.settingsControllerValue("FLOAT")){
				return !isNaN(parseFloat (value)) && (value % 1 != 0 || (value.split(".").length==2 && value.split(".")[1]==0));
			} else if(dataType == vrmUi.settingsControllerValue("BOOLEAN")){
				return value == 'TRUE' || value == 'FALSE' || value == 'true' || value == 'false';
			}*/
			return true;
		}
		return false;
	}
	
	/**
	 * Method to fetch the next list of threshold list
	 * 
	 * @return
	 */
	$scope.fetchNextThresholdList = function(){
		$scope.pageNumber++;
		$scope.fetchThresholdList($scope.pageNumber);
	};
	
	$scope.showDescriptionTooltip = function(index){
		//console.log("Inside showToolTip..." + $scope.displayToolTip + "   index :: " + index);
    	if(index == $scope.displayToolTip){
    		$scope.displayToolTip = -1;
    	} else {
    		$scope.displayToolTip = index;
    	}	
    	//console.log("$scope.displayToolTip ::" + $scope.displayToolTip);
	};
	
	$scope.fetchThresholdcategories();

	$scope.deleteButton = function(index) {
		$scope.addModeSelected = 0;
		$scope.otherModeSelected=1;
		angular.forEach($scope.deleteThresholdFlags, function(flag, ind) {
            $scope.deleteThresholdFlags[ind] = false;
        });
        angular.forEach($scope.editThresholdFlags, function(flag, ind) {
        	if(flag){
        		$scope.thresholdList[ind] = angular.copy($scope.thresholdListBackUp[ind]);
        	}
        	$scope.editThresholdFlags[ind] = false;
        });
	    $scope.deleteThresholdFlags[index] = true;
	};

	$scope.editButton = function(index) {
		$scope.addModeSelected = 0;
		$scope.otherModeSelected=1;
		angular.forEach($scope.deleteThresholdFlags, function(flag, ind) {
            $scope.deleteThresholdFlags[ind] = false;
        });
        angular.forEach($scope.editThresholdFlags, function(flag, ind) {
        	if(flag){
        		$scope.thresholdList[ind] = angular.copy($scope.thresholdListBackUp[ind]);
        	}
        	$scope.editThresholdFlags[ind] = false;
        });
	    $scope.editThresholdFlags[index] = true;
	};

	$scope.resetMode = function() {
		$scope.otherModeSelected=0;
		AlertMessaging.closeAllAlerts();
	};
	
	$scope.getchVDIzkConstants = function() {
		console.log("Inside getchVDIzkConstants");
		$scope.editModeSelected = 0;
		$scope.constantList = '';
		SettingService.getchVDIzkConstants(function(data){
			if(data.status == "Success" && data.object != null) {
				$scope.constantList = data.object;
			}
		}, function(data){
			AlertMessaging.closeAllAlerts();
			AlertMessaging.showAlert("Internal error occurred in fetching VDI Infrastructure. Please contact the system administrator with the code:"+data.code);
		});
	};
	
	$scope.editedConstantList = {};
	$scope.editConstant = function(value, path) {
		$scope.editedConstantList[path] = value;
	};
	
	$scope.saveConstantList = function() {
		console.log("Inside saveConstantList...");console.log($scope.editedConstantList);
		var data = [];
		for (var key in $scope.editedConstantList) {
			var obj = {"zkPath":key,"zkValue":$scope.editedConstantList[key]};
			data.push(obj); 
		}
		SettingService.savechVDIzkConstants(data, function(data){
			if(data.status == "Success") {
				$scope.editModeSelected = 0;
				AlertMessaging.closeAllAlerts();
				AlertMessaging.showAlert($filter('translate')('vdi.infrastrcture.view.SUCCESS_SAVE_VDI_INFRASTRUCTURE'), vrmUi.settingsControllerValue("SUCCESS"));
			}
		}, function(data){
			AlertMessaging.closeAllAlerts();
			AlertMessaging.showAlert($filter('translate')('svdi.infrastrcture.view.ERROR_SAVE_VDI_INFRASTRUCTURE')+data.code);
		});
	};
	
	$scope.restoreDefaults = function() {
		console.log("Inside restoreDefaults..");
		SettingService.restoreDefaultConstants(function(data){
			if(data.status == "Success") {
				$scope.getchVDIzkConstants();
				AlertMessaging.closeAllAlerts();
				AlertMessaging.showAlert($filter('translate')('vdi.infrastrcture.view.SUCCESS_RESTORE_VDI_INFRASTRUCTURE'), vrmUi.settingsControllerValue("SUCCESS"));
			}
		}, function(data){
			AlertMessaging.closeAllAlerts();
			AlertMessaging.showAlert($filter('translate')('vdi.infrastrcture.view.ERROR_RESTORE_VDI_INFRASTRUCTURE')+data.code);
		});
	};
	
	$scope.getchVDIzkConstants();
});