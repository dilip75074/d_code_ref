vrmUI.controller('NetworkConfigController', function($scope, $rootScope, $location, $route, NetworkConfigService, $modal, $filter, $translate) {
    console.log("Network Config Controller Loaded");
    
    $scope.isNetworkConfigPresent = false;
    
    if($rootScope.isBackFormPhysicalResourcePage == true)
        $scope.netConf1 = false;
    else
        $scope.netConf1 = true;
    
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

    // Define the scope variables for vRack Config
    $scope.vrackConfigdata = {};

    // Define the scope variables for network Config
    $scope.networkConfigdata = {};

    $scope.range = /^([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$/;
    /*$scope.numeric = /^[0-9]+$/;*/
    $scope.domainRegEx = /^(([a-zA-Z]+[0-9]*([-][a-zA-Z0-9]+)*)\.){1,2}[a-zA-Z]+$/;
    $scope.vlanIdRegEx = /^([0]?[0-9]{1,3}|[1-3][0-9]{3}|40[0-8][0-9]|409[0-4])$/;
    $scope.part1Ip = /^(0{0,2}[1-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$/;
    $scope.ntpRegEx = /^((0{0,2}[1-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])|([a-zA-Z]+\.[a-zA-Z0-9]+\.[a-zA-Z]+))$/;


    $scope.emptyvRackDataLoadedFromServer = false;
    $scope.checkAndChangeRackDomain = function(fieldName) {
        var string = '';
        if((!$scope.isNetworkConfigPresent || $scope.emptyvRackDataLoadedFromServer && $scope.isNetworkConfigPresent) && !$scope.formvrackconfig[fieldName].$error.required) {
            string += angular.copy($scope.vrackConfigdata[fieldName].split(' ')[0]);
            var stringRegEx = /^([a-zA-Z]+[0-9]*([-][a-zA-Z0-9]+)*)$/;
            var temp = angular.copy($scope.vrackConfigdata.pscDomainName);
            if(stringRegEx.exec(string)) {
                console.log(temp);
                if(temp == undefined) {
                    $scope.vrackConfigdata.pscDomainName = angular.copy(string)+'.com';
                } else {
                    if(temp.split('.').length == 3) {
                        if(fieldName == 'vrackName') {
                            string += '.'+temp.split('.')[1]+'.'+temp.split('.')[2];
                        } else if(fieldName == 'companyName') {
                            string = temp.split('.')[0]+'.'+string+'.'+temp.split('.')[2];
                        }
                    }
                    if(temp.split('.').length == 2) {
                        if(fieldName == 'vrackName') {
                            if(!$scope.formvrackconfig['companyName'].$error.required) {
                                string += '.'+temp;
                            } else {
                                string += '.'+temp.split('.')[1];
                            }
                        } else if(fieldName == 'companyName') {
                            if(!$scope.formvrackconfig['vrackName'].$error.required) {
                                string = temp.split('.')[0]+'.'+string+'.'+temp.split('.')[1];
                            } else {
                                string += '.'+temp.split('.')[1];
                            }
                        }
                    }
                    $scope.vrackConfigdata.pscDomainName = angular.copy(string);
                }
            }
        }
    };

    // Fetch the properties to show it on the UI
    NetworkConfigService.fetchNetworkConfigProperties(function(vrackConfigData, networkConfigData) {
        console.log("Inside success for fetch Properties for network config for the network config screen, data: ")
        $scope.vrackConfigdata = vrackConfigData;
        $scope.networkConfigdata = networkConfigData;
        if(Object.keys($scope.vrackConfigdata).length == 0) {
            $scope.emptyvRackDataLoadedFromServer = true;
        }        
        if(undefined != $scope.networkConfigdata.subnet) {
            $scope.isNetworkConfigPresent = true;
        } else {
            $scope.isNetworkConfigPresent = false; 
        }
            
    }, function(data) {
         // Do nothing as if error in fetching then silently ignore it and let him save the properties
        
    });

    /**
     * Method to save the vRack config
     * 
     */
    $scope.vrackConfig = function(data) {
        $scope.submitted = 1;

        if($scope.formvrackconfig.$valid){
        
            console.log("in network configuration");

            NetworkConfigService.vrackConfig(data, function(data, status) {
                if (data.status == vrmUi.getNetworkConfigurationValue("SUCCESS")) {
                    $scope.vrackConfigmessage = null;
                    $scope.vrackConfigSuccessMessage = $filter('translate')('networkconfig.controller.VRACK_SAVED');
                }
            }, function(data, status) {
                $scope.vrackConfigSuccessMessage = null;
                $scope.vrackConfigmessage = $filter('translate')('networkconfig.controller.VRACK_SAVE_SERVER_ERROR')+data[vrmUi.getNetworkConfigurationValue("CODE")];
            });
        }
    };

    /**
     * Method to save the network config
     * 
     */
    $scope.networkConfig = function(networkConfigdata) {
        $scope.submitted = 2;
        if($scope.formvrackconfig.$valid && $scope.formnetworkconfig.$valid){
            console.log('in network config controller');
            var data = {};
            var domainData = {};
            angular.forEach(networkConfigdata, function(value, key) {
                data[key] = value;
            });
            NetworkConfigService.networkConfig(data, function(magmtData, status) {
                if (magmtData.status == vrmUi.getNetworkConfigurationValue("SUCCESS")) {
                    $scope.isNetworkConfigPresent = true;
                    $scope.isNetworkConfigPresentFlag = true;
                    $scope.networkConfigmessage = null;
                    $scope.networkConfigSuccessMessage = $filter('translate')('networkconfig.controller.NETWORK_SAVED');                        

                    //$location.url(vrmUi.getNetworkConfigurationValue("IP_REALLOCATION"));
                } else {
                	$scope.networkConfigSuccessMessage = null;
                	$scope.networkConfigmessage = "Overlap in network: "+magmtData.object["networkType"]+" please enter a subnet with no overlap and try again.";
                }
            }, function(data, status) {
                $scope.networkConfigSuccessMessage = null;
                $scope.networkConfigmessage = $filter('translate')('networkconfig.controller.NETWORK_SAVE_SERVER_ERROR')+data[vrmUi.getNetworkConfigurationValue("CODE")];
            });
        }else if($scope.formvrackconfig.$invalid){
            $scope.submitted= 1;
            $scope.netConf1 = true;
        }
    };
    
    $scope.redirect = function(pageName) {
        if($scope.isNetworkConfigPresent == true){
            $scope.isNetworkConfigPresentFlag = true;
            $location.url(pageName);
        } else {
            $scope.isNetworkConfigPresentFlag = false;
        }
    };
});