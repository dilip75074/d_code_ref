/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/

vrmUI.controller('LogicalResourcesController', function($scope, LogicalResourcesService, $rootScope, $filter) {
    $scope.showVcenters = false;
    /*$scope.waitAndErrorMsg = "Please wait...";*/

    // Loading Mask
    $rootScope.ShowFullScreenLoading = false;
    $rootScope.ShowFullScreenLoadingMsg = '';
    
    /*$scope.vcenterList = {};
     $scope.hostList = {};
     $scope.hostDetails = {};*/

    $scope.getVcenterList = function() {
        
        // Loading Mask
        $rootScope.ShowFullScreenLoading = true;
        $rootScope.ShowFullScreenLoadingMsg = $filter('translate')('logicalresources.controller.PLEASE_WAIT_LOAD_VCENTERS');

        LogicalResourcesService.getAllvCenters(function(data) {
            // Loading Mask
            $rootScope.ShowFullScreenLoading = false;
            $rootScope.ShowFullScreenLoadingMsg = '';

            if (data.status != vrmUi.getLogicalResourcesValue("FAILED") && null != data.object) {
                console.log(JSON.stringify(data));
                $scope.vcenterList = data.object;
                $scope.showVcenters = true;
                
                if($scope.vcenterList.length == 0){
                    $scope.vcenterListError = $filter('translate')('logicalresources.controller.NO_VCENTERS');
                }
            } else {
                $scope.vcenterListError = $filter('translate')('logicalresources.controller.FAILED_TO_LOAD_VCENTERS');
                $scope.showVcenters = true;
            }
        }, function(data) {
            // Loading Mask
            $rootScope.ShowFullScreenLoading = false;
            $rootScope.ShowFullScreenLoadingMsg = '';

            //$scope.vcenterListError = "Failed to load vCenter list";
            //$scope.showVcenters = true;
            $scope.waitAndErrorMsg = $filter('translate')('logicalresources.controller.LOAD_VCENTERS_SERVER_ERROR')+data[vrmUi.getLogicalResourcesValue("CODE")];
               	
        });
        return false;
    };

    $scope.loadVcenterDetails = function(selectedVcenterIndex) {
        console.log("Selected vCenter is: " + selectedVcenterIndex);
        $scope.selectedVcenterIndex = selectedVcenterIndex;
        
        $scope.hostList = $scope.vcenterList[selectedVcenterIndex].hostList;
        console.log("Selected vCenter host list is: ");
        console.log($scope.hostList);
        $scope.selectedVcenter = $scope.vcenterList[selectedVcenterIndex].name;
        
        $scope.shoWDiv(vrmUi.getLogicalResourcesValue("DIV2"));
        return false;
    };

    $scope.loadHostDetails = function(selectedHost) {
        $scope.selectedHost = selectedHost;
        for (var i = 0; i < $scope.hostList.length; i++) {
            if ($scope.hostList[i].name == selectedHost) {
                $scope.hostDetails = $scope.hostList[i];
            }
        }
        $scope.shoWDiv(vrmUi.getLogicalResourcesValue("DIV3"));
        return false;
    };

    $scope.shoWDiv = function(divId) {
        if (divId == vrmUi.getLogicalResourcesValue("DIV1")) {
            $scope.hideAllDivs();
            $scope.div1Flag = true;
        } else if (divId == vrmUi.getLogicalResourcesValue("DIV2")) {
            $scope.hideAllDivs();
            $scope.div2Flag = true;
        } else if (divId == vrmUi.getLogicalResourcesValue("DIV3")) {
            $scope.hideAllDivs();
            $scope.div3Flag = true;
        } else if (divId == vrmUi.getLogicalResourcesValue("LISTVIEW")) {
            $scope.listViewFlag = true;
        } else if (divId == vrmUi.getLogicalResourcesValue("MAPVIEW")) {
            $scope.mapViewFlag = true;
        }
        return false;
    };

    $scope.hideAllDivs = function() {
        $scope.div1Flag = false;
        $scope.div2Flag = false;
        $scope.div3Flag = false;

        $scope.listViewFlag = false;
        $scope.mapViewFlag = false;
        return false;
    };

    $scope.cancel = function() {
        $rootScope.modalInstance.close();
    };

    $scope.getVcenterList();
    $scope.hideAllDivs();

    $scope.shoWDiv(vrmUi.getLogicalResourcesValue("DIV1"));
    $scope.shoWDiv(vrmUi.getLogicalResourcesValue("LISTVIEW"));
});