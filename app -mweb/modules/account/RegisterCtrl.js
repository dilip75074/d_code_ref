'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:RegisterCtrl
 */
angular.module('stpls').controller('RegisterCtrl', ['$scope', '$rootScope', 'Account', 'ShippingConfig', 'NuData',
  function($scope, $rootScope, Account, ShippingConfig, NuData) {

    $scope.isLoading = false;

    $scope.dataAddress = {
    };

    // default values
    $scope.data = {
        emailPreference: true,
        autoLoginPreference: true,
        rewardsMemberOption: 'doNotJoinRewards'
    };

    $scope.changeSubscribeStatus = function changeSubscribeStatus() {
        $scope.data.emailPreference = ! $scope.data.emailPreference;
    };

    $scope.autoLogin = function autoLogin() {
        $scope.data.autoLoginPreference = ! $scope.data.autoLoginPreference;
    };

    // attempt to populate the username field with the value from email field (if there is one) but only do it on first focus
    $scope.populateUserName = function populateUserName(userNameField, emailField) {
        if (userNameField.$untouched && emailField) {
            $scope.data.logonId = emailField;
        }
    };

    $scope.save = function save(form) {
        if (form.$valid) {

            try {
                if (NuData.enabled && typeof nds !== "undefined") {
                    nds.send();
                }
            } catch(ex) {
                console.log ('error accessing NuData nds.send(), exception was ' + ex);
            }

            $scope.isLoading = true;

            $scope.data.newReEnterEmailAddr = $scope.data.email1;

            Account.registerUser($scope.data, $scope.dataAddress.rewardsAddress).then(function() {
                $scope.errorMsg = undefined;
                $scope.isLoading = false;
                ShippingConfig.init();
                $rootScope.toRoute('home', null, {location: "replace"});

            }, function(error) {
                console.log('error registering new account', error);
                $scope.errorMsg = error;
                $scope.isLoading = false;
            });
        }
    };
  }
]);
