vrmUI.controller('SelectConfigurationController', function($scope, $rootScope, $location, $route, $modal, $filter){

    console.log('select config controller loaded');

    $scope.cancel = function() {
        $rootScope.modalInstance.close();
    };

    $scope.showVDIConfiguration = function(){
        $rootScope.VDIInstance = $modal.open({
            templateUrl: vrmUi.getSelectConfigurationControllerValue("WORKLOAD_CONFIGURATION"),
            backdrop: vrmUi.getSelectConfigurationControllerValue("BACKDROP"),
            keyboard: false
        });
        $scope.cancel();
    };

    $scope.showIAASConfiguration = function(){
        $rootScope.IAASInstance = $modal.open({
            templateUrl: vrmUi.getSelectConfigurationControllerValue("IAAS_CONFIGURATION"),
            backdrop: vrmUi.getSelectConfigurationControllerValue("BACKDROP"),
            keyboard: false
        });
        $scope.cancel();
    };
});