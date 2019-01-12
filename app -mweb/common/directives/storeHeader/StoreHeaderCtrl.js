'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:StoreHeaderCtrl
 */
angular.module('stpls').
    controller('StoreHeaderCtrl', function($scope, $element, $timeout, $rootScope, $translate, Account, Locator, DefaultStore) {

    $scope.storeLabel = $translate.instant('LCR_NEAREST');

    var captureStore = function() {
        if ($scope.store) {
            DefaultStore.saveStoreFromHeader($scope.store);
        }
    };

    //  Look for the "My Store" first
    $scope.store = Locator.getRememberedStore();
    if ($scope.store) {
        $scope.storeLabel = $translate.instant('LCR_MY_STORE') + ":";
        $scope.todayHours = Locator.getHoursDisplay($scope.store);
        $scope.ready = true;
        captureStore();
    } else {
        //  find nearest store
        $timeout(function() { // - defer to free thread
          var result = Locator.getStoresByAddr(Account.getZipCode(), 40);
          result.then(function(store) {
              $scope.store = store[0];
              $scope.todayHours = Locator.getHoursDisplay($scope.store);
          }, function(error) {
              $scope.store = undefined;
          })['finally'](function() {
            $scope.ready = true;
            captureStore();
          });
        }, 100);
    }

   $scope.changeStore = function() {
        $rootScope.toRoute('displayStores', {
            storeNo: $scope.store.store_number,
            zip: $scope.store.store_address.zip
        });
    };

    /*  Event triggered when store selection on store list changed */
    $rootScope.$on('preferredStoreChanged', function(event, data) {
        $scope.store = data.selStore;
        $scope.storeLabel = $translate.instant('LCR_MY_STORE') + ":";
        $scope.todayHours = Locator.getHoursDisplay($scope.store);
        captureStore();
    });

    /*  Event triggered when sessionGeo changed */
    $rootScope.$on('nearestStoreChanged', function(event, data) {
        if (data.selStore) {
            $scope.store = data.selStore;
            captureStore();
        }
        $scope.storeLabel = $translate.instant('LCR_NEAREST');
        $scope.todayHours = Locator.getHoursDisplay($scope.store);
    });

});
