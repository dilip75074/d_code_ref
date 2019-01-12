'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:ShipToStoreCtrl
 */
angular.module('stpls').controller('ShipToStoreCtrl', function($scope, $rootScope, $state, $stateParams, $translate, $timeout, $interval, $window, Locator, Account, Seo) {

    $scope.searchStores = [];
    $scope.stores = [];
    $scope.currentStoreNo = null;
    $scope.currentZip = null;
    $scope.showError = false;
    $scope.loading = false;
    $scope.chooseMsg = $translate.instant('LCR_CHOOSE');
    $scope.geoMsg;
    $scope.addr;

    var saveState = $state.current.name;

    var init = function(addr, userSearch) {
        $scope.addr = addr;
        $scope.searchStores = [];
        $scope.showError = false;

        var results = Locator.getStoresByAddr(addr);
        results.then(function(stores) {

            if (stores !== undefined && stores.length) {
                if (userSearch) {
                    $scope.searchStores = stores;
                } else {
                    $scope.searchStores = stores;
                    $scope.stores = stores;
                }
            } else {
                $scope.stores = [];
                $scope.searchStores = [];
                $scope.showError = true;

            }


        }, function(error) {
            $scope.zipSearch.input_error = true;
            $scope.loading = false;
            console.log('error getting stores, error = ' + error);
        });

    };

    $scope.storeSelected = function(store) {
        if (saveState.includes('shipToStores')) {
            //  update local storage for STS
            var shipToStore = {
                address: store.store_address.address_line1,
                city: store.store_address.city,
                state: store.store_address.state,
                zipCode: store.store_address.zip,
                storeNumber: store.store_number
            };
            localStorage.setItem('shipToStoreAddress', JSON.stringify(shipToStore));
            $rootScope.toRoute('cart');
        } else if (saveState.includes('displayStores')) {
            $scope.viewStoreDetail(store);
        }
    };

     $scope.viewStoreDetail = function(store) {
        var seo = $state.params.addr;
        var address = store.store_address;
        if (address) {
            seo = [address.address_line1, address.city, address.state, address.zip];
        }

        // MWINHS-2013: decouple from main /locator route, but keep state params
        $state.go('stores', {
            seo: Seo.sanitizer.uri(seo, '-'),
            store: store.store_number,
            addr: $scope.addr, // preserve query
            results: $scope.stores, // keep results
            detail: store // pass store detail
         });
    };

    $scope.searchByGeo = function() {
        $scope.loading = true;
        $scope.geoMsg = undefined;

        //  self-document
        var radius = 50;
        var offset = 0;
        var limit = 20;
        var results = Locator.getStoresByGeo(radius, limit, offset);
        results.then(function(stores) {
            $scope.searchStores = stores;
            $scope.chooseMsg = $translate.instant('LCR_STORES_GEO');
            $scope.loading = false;
        }, function(error) {
            var msg = String(error);
            if (msg.indexOf($translate.instant('LCR_NO_GEO_TEXT')) > 0) {
                $scope.geoMsg = $translate.instant('LCR_NO_GEO_TEXT');
            } else {
                $scope.geoMsg = msg;
            }
            $scope.loading = false;
        });

    };

    $scope.radioButtonClicked = function(store) {
        angular.forEach($scope.stores, function(aStore) {
            if (aStore !== store && aStore.selected) {
                aStore.selected = false;
            }
        });
        store.selected = !store.selected;
        // set preferred store
        var checked = false;
        Locator.setRememberedStore(store);
        $rootScope.$broadcast('preferredStoreChanged', {
            selStore: store
        });
        $rootScope.toRoute('home');
    };

    $scope.searchByZip = function() {
        // Hide keyboard
        document.getElementsByName('zipsearch')[0].blur();

        if ($scope.zipSearch.input === undefined || $scope.zipSearch.input.length === 0) {
            $scope.chooseMsg = $translate.instant('LCR_CHOOSE');
            return false;
        } else {
            var zip = $scope.zipSearch.input;
            var msg =  String($translate.instant('LCR_STORES_ZIP'));
            $scope.chooseMsg = msg.replace("%zip%", $scope.zipSearch.input);

            init(zip, true);
        }
    };

    $scope.currentStoreNo = $stateParams.storeNo;
    $scope.currentZip = $stateParams.zip;
    //  But we always want to display the actual current store of the user, right?
    var currentStore = Locator.getRememberedStore();
    if (currentStore) {
        $scope.currentStoreNo = currentStore.store_number;
        $scope.currentZip = currentStore.store_address.zip;
    }

    var zip = $scope.currentZip;
    if (!zip) {
        zip = Account.getZipCode();
    }

    $scope.showError = false;
    $scope.loading = true;
    init(zip, false);
});


/*  This is a custom filter that will filter the
 *  items array ONLY the current store which is the
 *  passed parameter 'currentStore'
 */
angular.module('stpls').filter('isCurrentShipToStore', function() {
    return function(items, currentStore) {
         return _.filter(items, function(item) {
            return item.store_number == currentStore;
        });

    };
});

/*  This is a custom filter that will filter the
 *  items array to ALL BUT the current store which
 *  is the passed parameter 'currentStore'
 */
angular.module('stpls').filter('notCurrentShipToStore', function() {

    return function(items, currentStore) {

        return _.filter(items, function(item) {
            return item.store_number != currentStore;
        });

    };
});
