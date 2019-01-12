'use strict';

angular.module('stpls')
    .directive('addressEntry', function($rootScope) {
        return {
            restrict: 'E',
            scope: {
                addressModel: '=', //  address model
                addressType: '=', //  address type, i.e. shipping, billings
                visaCheckout: '=', //  VisaCheckout mode
                addressCount: '=',
                hasAddressData: '=',
                expand: '='
            },
            templateUrl: 'modules/address/views/Address_Entry.html',
            link: function(scope, element, attr) {
                scope.element = element;
            },
            controller: function($scope, $translate, $timeout, Addresses, GoogleMapLoader) {

                $scope.errorMsg = '';
                $scope.placeFound = false;
                $scope.place = {
                    addressLine1: '',
                    city: '',
                    state: '',
                    zip: '',
                };

                if (!$scope.addressModel || !$scope.addressModel.addressLine1) {
                    $scope.addressModel = {
                        addressLine1: '',
                        addressLine2: '',
                        city: '',
                        state: '',
                        zip: ''
                    };
                }

                $scope.place.addressLine1 = $scope.addressModel.addressLine1;
                $scope.place.city = $scope.addressModel.city;
                $scope.place.state = $scope.addressModel.state;
                $scope.place.zip = $scope.addressModel.zip;

                $scope.$watch('expand', function(value) {
                    if (!value) {
                        if (!$scope.addressModel || !$scope.addressModel.addressLine1) {
                            $scope.addressModel = {
                                addressLine1: '',
                                addressLine2: '',
                                city: '',
                                state: '',
                                zip: ''
                            };
                        }
                        $scope.addressModel.address =
                            $scope.addressModel.addressLine1 + ' ' +
                            $scope.addressModel.addressLine2 + ' ' +
                            $scope.addressModel.city + ' ' +
                            $scope.addressModel.state + ' ' +
                            $scope.addressModel.zip;
                        $scope.addressModel.address = $scope.addressModel.address.trim();
                        if ($scope.addressType === 'shipping') {
                            $scope.$parent.setUseShippingLabel($scope.addressModel);
                        }
                        if ($scope.addressModel.address !== '') {
                            ($scope.$parent.dataChanged || angular.noop)();
                        }
                    }
                });

                var ignoreAction = {
                    title: 'Ignore',
                    callback: function() {
                        $scope.expand = !$scope.expand;
                    }
                };

                $scope.inputFocused = function(e) {

                  ($scope.$parent.inputFocused || angular.noop)(e);
                };

                $scope.entryChanged = function () {
                    //  Determine if user filled in all the fields
                    if (($scope.addressModel.addressLine1 && $scope.addressModel.addressLine1.trim() > '') &&
                       ($scope.addressModel.city && $scope.addressModel.city.trim() > '') &&
                       ($scope.addressModel.state && $scope.addressModel.state.trim() > '') &&
                       ($scope.addressModel.zip && $scope.addressModel.zip.trim() > '')) {
                        $scope.expand = false;
                    }

                    ($scope.$parent.inputBlurred || angular.noop)();
                };

                $scope.addressChanged = function () {

                    ($scope.$parent.dataChanged || angular.noop)();
                };


                $scope.userClickChevron = function () {
                    var errorMsg;

                    if ($scope.expand) {
                        if (!$scope.addressModel.addressLine1 || $scope.addressModel.addressLine1.trim () === '') {
                            errorMsg = $translate.instant ('ADR_INVALID_LINE1');
                        } else if (!$scope.addressModel.city || $scope.addressModel.city.trim () === '') {
                            errorMsg = $translate.instant ('ADR_INVALID_CITY');
                        } else if (!$scope.addressModel.state || $scope.addressModel.state.trim () === '') {
                            errorMsg = $translate.instant ('ADR_INVALID_STATE');
                        } else if (!$scope.addressModel.zip || $scope.addressModel.zip.trim () === '') {
                            errorMsg = $translate.instant ('ADR_INVALID_ZIP');
                        }
                        if (errorMsg) {
                            $rootScope.error(errorMsg, ignoreAction);
                            return;
                        }
                    }

                    // $scope.expand = !$scope.expand;
                };

                setTimeout(function() {

                    //  Get the element for the directive
                    var directiveElement = $scope.element[0];
                    $scope.addressType = directiveElement.getAttribute('address-type');

                    var options = {
                        componentRestrictions: {
                            country: "us"
                        }
                    };

                    //  Address line is the first input field in the directive
                    var addressField = directiveElement.getElementsByTagName('input')[0];

                    GoogleMapLoader.loadGoogleMap(function() {

                        var fieldAutoComplete = new google.maps.places.Autocomplete(addressField, options);

                            google.maps.event.addListener(fieldAutoComplete, 'place_changed', function() {
                                $scope.$apply(function() {
                                    $scope.placeFound = true;
                                    var place = fieldAutoComplete.getPlace();

                                    var placeGet = function(name) {
                                        var v = '';
                                        angular.forEach(place.address_components, function(comp) {
                                            if (comp.types[0] === name) {
                                                v = comp.short_name;
                                            }
                                        });
                                        return v;
                                    };

                                    var cityTest = placeGet('locality');
                                    if (!cityTest || cityTest === '') {
                                        cityTest = placeGet('sublocality_level_1');
                                    }
                                    $scope.place = {
                                        addressLine1: place.name,
                                        city: cityTest,
                                        state: placeGet('administrative_area_level_1'),
                                        zip: placeGet('postal_code')
                                    };

                                    $scope.addressModel.address = $scope.place.addressLine1 + ' ' + $scope.place.city + ' ' + $scope.place.state + ' ' + $scope.place.zip;
                                    $scope.addressModel.addressLine1 = $scope.place.addressLine1;
                                    $scope.addressModel.city = $scope.place.city;
                                    $scope.addressModel.state = $scope.place.state;
                                    $scope.addressModel.zip = $scope.place.zip;
                                    //  Only do the following if this is a shipping address.
                                    if ($scope.addressType === 'shipping') {
                                        $scope.$parent.setUseShippingLabel($scope.addressModel);
                                    }
                                    ($scope.$parent.dataChanged || angular.noop)();

                                });
                            });

                    });
                }, 500);
            }
        }
    });
