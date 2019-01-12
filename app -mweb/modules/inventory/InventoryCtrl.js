'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:InventoryCtrl
 */
angular.module('stpls').controller('InventoryCtrl', function($scope, $stateParams, $rootScope, $state, $translate, $timeout, $interval, $window, Account, MobileService, StoreInventory, Cart, Locator, DefaultStore, Seo) {

    $scope.stores = [];
    $scope.searchStores = [];
    $scope.inList = false;
    $scope.currentSKU = null;
    $scope.currentStoreNo = null;
    $scope.showError = false;
    $scope.showUpdateError = false;
    $scope.defaultStore = null;
    $scope.chooseMsg = $translate.instant('LCR_CHOOSE');
    $scope.loading = false;
    $scope.currentProduct = null;
    $scope.returnRoute;
    $scope.geoMsg;

    var init = function(zip, userSearch) {

        $scope.defaultStore = DefaultStore.getStore();

        $scope.currentSKU = $stateParams.sku;
        $scope.currentStoreNo = $stateParams.storeNo;
        $scope.currentProduct = $stateParams.product;
        $scope.returnRoute = $stateParams.returnRte;

        /*  Get the stores containing inventory
         *  for the passed SKU in a radius from the
         *  passed zip code.
         */
        $scope.searchStores = [];
        $scope.loading = true;
        $scope.showError = false;
        $scope.inList = false;
        var results = StoreInventory.getInventoryFromStoreRadius(zip, $scope.currentSKU);
        results.then(function(data) {
            if (data) {
                if (userSearch) {
                    $scope.searchStores = data;
                } else {
                    $scope.searchStores = data;
                    $scope.stores = data;
                }
                var test = $scope.isCurrentStoreInList($scope.searchStores);
                $scope.inList = (test.length > 0);

            } else {
                $scope.stores = [];
                $scope.searchStores = [];
                $scope.showError = true;
            }
        }, function(error) {
            $scope.showError = true;
            console.log('error getting BOPIS inventory', error);

        })['finally'](function(){
            $scope.loading = false;
        });
    };


   $scope.storeSelected = function(store) {
        $scope.showUpdateError = false;

        if (!$scope.returnRoute) {
            $scope.returnRoute = 'cart';
        }

        if ($scope.returnRoute === 'cart') {
            Cart.updateBopisStore(store.storeNumber, store.address, store.city, store.state, store.postalCode).then(function() {
                $rootScope.toRoute($scope.returnRoute);
            }, function(error) {
                $scope.showUpdateError = true;
                console.log('error updating Bopis item', error);
            });
        } else if ($scope.returnRoute === 'product') {
             var defaultStore = {
                address: store.address,
                city: store.city,
                state: store.state,
                phoneNumber: store.phoneNumber,
                zip: store.postalCode,
                distance: store.distance,
                stockLevel: '',
                invQty: store.inventory[0].quantity,
                storeNumber: store.storeNumber,
                sku: $scope.currentSKU
            };
            //  Save the selected store
            DefaultStore.saveStore(defaultStore);
            // $rootScope.back();
            var product = $scope.currentProduct;
            $rootScope.toRoute($scope.returnRoute, {
              sku: $scope.currentSKU,
              seo: (product && Seo.quartz.sku(product).uri) || ''
            });
        }
    };

    $scope.isCurrentStoreInList = function(items) {
        return _.filter(items, function(item) {
            return item.storeNumber === $scope.currentStoreNo;
        });
    };

    $scope.searchByZip = function($event) {
        $event.preventDefault();
        var elem = document.forms.searchByZipForm.zipsearch;

        $scope.searchByZipForm.zipsearch.$valid = $scope.validate.zip.test($scope.searchByZipForm.zipsearch.$modelValue);
        $scope.searchByZipForm.zipsearch.$invalid = !$scope.searchByZipForm.zipsearch.$valid;
        if ($scope.searchByZipForm.zipsearch.$valid) {
            $timeout(elem.blur.bind(elem));
            var zip = $scope.zipsearch.input;
            init(zip, true);
            var msg =  String($translate.instant('LCR_STORES_STOCK_ZIP'));
            $scope.chooseMsg = msg.replace('%zip%', $scope.zipsearch.input);
        } else {
            elem.focus();
            elem.select();
        }
    };

    $scope.searchByGeo = function() {
        $scope.loading = true;
        $scope.geoMsg = undefined;

        //  Get Current location Lat / Long
        var coords = Locator.getExistingLatLong();

        coords.then(function(coords) {
            var postalCode;
            var geocoder = new google.maps.Geocoder();
            var latlng = new google.maps.LatLng(coords.lat, coords.lon);

            geocoder.geocode({'latLng': latlng}, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    if (results[0]) {
                        for(var i=0; i<results[0].address_components.length; i++) {
                            var component = results[0].address_components[i];   //minimize lookups and also better for minification
                            if (component.types && component.types.length && component.types[0] === 'postal_code') {
                                postalCode = component.short_name;
                                if (postalCode) {
                                    $scope.showError = false;
                                    //$scope.zipsearch.input = '';
                                    init(postalCode, true);
                                    var msg = String($translate.instant('LCR_STORES_STOCK_ZIP'));
                                    $scope.chooseMsg = msg.replace("%zip%", postalCode);
                                    break;
                                }
                            }
                        }
                     }
                 }
            });
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

    $scope.callStore = function($event, n) {
        document.location.href = 'tel:' + n;
        $event.stopPropagation();
        $event.preventDefault();
    };

    $scope.validate = {
        zip: /^\d{5}$/
    };


    $scope.currentZip = $stateParams.zip;
    var zip = $scope.currentZip;
    if (!zip) {
        zip = Account.getZipCode();
    }

    $scope.showError = false;
    init(zip, false);
});

/*  This is a custom filter that will filter the
 *  items array ONLY the current store which is the
 *  passed parameter 'currentStore'
 */
angular.module('stpls').filter('isCurrentStore', function() {
    return function(items, currentStore) {

        return _.filter(items, function(item) {
            return item.storeNumber === currentStore;
        });

    };
});

/*  This is a custom filter that will filter the
 *  items array to ALL BUT the current store which
 *  is the passed parameter 'currentStore'
 */
angular.module('stpls').filter('notCurrentStore', function() {

    return function(items, currentStore) {

        return _.filter(items, function(item) {
            return item.storeNumber !== currentStore;
        });

    };
});
