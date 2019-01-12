'use strict';

angular.module('stpls')
    .directive('mcsStore', function(NgMap, GoogleMapLoader, Locator, $rootScope) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                store: '=',
                data: '='
            },
            templateUrl: 'modules/mcs/cards/store/Store.html',
            link: function($scope, element, attrs) {

                function init() {
                    if ($scope.store) {
                        var storeAddress = $scope.store.store_address;

                        $scope.location = storeAddress.city + ', ' + storeAddress.state;
                        $scope.addressline1 = storeAddress.address_line1;
                        $scope.address =  $scope.addressline1 + ', ' + $scope.location + ' ' + storeAddress.zip;
                        if (storeAddress.phoneNumber) {
                            $scope.phoneNumber = storeAddress.phoneNumber;
                        } else if (storeAddress.phone_number) {
                            $scope.phoneNumber = storeAddress.phone_number;
                        }

                        $scope.hours = Locator.getHoursDisplay($scope.store, true);

                        if($scope.hours.includes('Open now')) {
                            $scope.hoursText = 'Open now';
                            $scope.hoursTime = $scope.hours.split('now ')[1];
                        } else if($scope.hours.includes('Closed')) {
                            $scope.hoursText = 'Closed';
                        } else {
                            $scope.hoursText = $scope.hours;
                        }
                    }

                    GoogleMapLoader.loadGoogleMap(function() {
                        $scope.show = true;
                    });
                }

                init();

                $scope.changeStore = function() {
                    $rootScope.toRoute('displayStores', {
                        storeNo: $scope.store.store_number,
                        zip: $scope.store.store_address.zip
                    });
                };

                $scope.openGoogleMaps = function(event, address) {
                  var urlSafeAddressString = "https://maps.google.com/?q=" + encodeURIComponent(address);

                  if (event.isTrusted) {
                    window.open(urlSafeAddressString, '_blank');
                    event.stopPropagation();
                  }
                };

                $scope.callStore = function($event, n) {
                    document.location.href = 'tel:' + n;
                    $event.stopPropagation();
                    $event.preventDefault();
                };

                function cardtStoreChanged(event, data) {
                    if (data.selStore) {
                        $scope.store = data.selStore;
                        init();
                    }
                }

                $scope.$on('cardtStoreChanged', cardtStoreChanged);
            }
        };
    });
