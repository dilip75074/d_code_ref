'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:ProductHelpCtrl
 */
angular.module('stpls')
    .controller('ProductHelpCtrl', ['$scope', 'Help', function($scope, Help) {

    $scope.helpContent = false;

    $scope.loadHelp = function(helpType){
        var d;

        if (!helpType) {
            helpType = 'STS';
        } else {
            helpType = helpType.toUpperCase();
            if (helpType != 'STS' && helpType != 'STA') {
                helpType = 'STS';
            }
        }

        // Get help content
        switch (helpType) {
            case 'STS':
                d = Help.getShipToStoreCtrlContent();
                break;
            case 'STA':
            default:
                d = Help.getDeliveryPolicyCtrlContent();
                break;
            }

        d.then(function(r){

            $scope.helpContent = r.data;

        });

    };

}]);
