'use strict';

angular.module('stpls')
    .directive('address', function($rootScope, $timeout) {
        return {
            restrict: 'E',
            scope: {
                addresses: '=addresses',
                addressCount: '=addressCount',
                addressType: '@',
                id: '=id', //  a lookup address id (when inline is used)
                display: '=display', //  display mode: form or inline
                editable: '=editable', //  does list show edit, delete, add buttons
                selectable: '=selectable', //  does list show a radio selection button
                showCounter: '=showCounter', //  does list show a counter label,
                checkoutAddressId: '=checkoutAddressId' // if any, the currently selected address ids in checkout
            },
            templateUrl: 'modules/address/views/Address.html',
            controller: function($scope, $modal, $translate, Addresses, MobileService) {

                // backup copy in case we cancel edits
                $scope.master = {};
                // editing an address (form visible)
                $scope.editMode = false;
                // adding an address (form visible)
                $scope.addMode = false;
                //  loading message;
                $scope.isLoading = false;

                // the current address/address being edited
                $scope.address = {};
                // no errors yet
                $scope.errorMsg = '';
                // hide the footer
                $rootScope.hide_footer = true;

                $scope.sessionUser = (MobileService.getSessionState() === 'registered');

                if ($scope.display === 'inline') {
                    $scope.editMode = false;
                    $scope.addMode = false;
                }

                $scope.refresh = function() {
                    Addresses.getAddresses().then(function(response) {
                        if (response) {
                            $scope.addresses = response;
                        } else {
                            $scope.addresses = null;
                        }
                        $scope.addressCount = $scope.addresses.length;
                        // backup copy in case cancel is pressed
                        $scope.master = angular.copy($scope.addresses);

                        $scope.editMode = false;
                        $scope.addMode = false;

                     }, function(error) {
                        $scope.addresses = null;

                     })['finally'](function() {
                        // tell ProfileCtrl to update its counters
                        $rootScope.$broadcast('countersChanged', {
                        });
                        $scope.isLoading = false;
                     });
                };

                $scope.refresh();

                //  When Add button is selected
                $scope.create = function() {
                    $scope.addMode = true;
                    $scope.editMode = false;

                    // create new empty address
                    $scope.address = {};
                    // backup copy in case cancel is pressed
                    $scope.master = angular.copy($scope.addresses);

                    $scope.prompt({
                        header: { close: true },
                        addressIn: $scope.address,
                        editMode: $scope.editMode,
                        addMode: $scope.addMode,
                        dir: this,
                        animation: true,
                    }, 'Address_AddEdit', 'modules/address/views/Address_AddEdit.html', 'AddressPromptCtrl');
                };

                //  When Edit button is selected
                $scope.edit = function(address) {
                    $scope.editMode = true;
                    $scope.addMode = false;

                    // set address to the one we're editing
                    $scope.address = address;

                    // backup copy in case cancel is pressed
                    $scope.master = angular.copy($scope.addresses);

                    $scope.prompt({
                        header: { close: true },
                        addressIn: $scope.address,
                        editMode: $scope.editMode,
                        addMode: $scope.addMode,
                        dir: this,
                        animation: true,
                    }, 'Address_AddEdit', 'modules/address/views/Address_AddEdit.html', 'AddressPromptCtrl');
                };

                $scope.setIsLoading = function() {
                    $scope.isLoading = true;
                };

                //  Hide the form and show the list of addresses again
                $scope.cancelEdit = function(form) {
                    // copy the original back since we didn't save
                    $scope.addresses = angular.copy($scope.master);
                    form.$setPristine();
                    form.$setUntouched();
                    $scope.addMode = false;
                };

                //  Delete the address
                $scope.delete = function(addressId) {
                    $scope.isLoading = true;
                    $scope.errorMsg = undefined;
                    var address = getAddressById(addressId);

                    if ($scope.checkoutAddressId) {
                        for (var x = 0; x < $scope.checkoutAddressId.length; x++) {
                            if (addressId === $scope.checkoutAddressId[x]) {
                                //  can't delete the currently selected id
                                $scope.errorMsg = $translate.instant('ADR_ADDRESS_DELETE_CURRENT');
                                if (address) {
                                    address.showOverlay = true;
                                }
                                countDownOverlay(address);
                                return;
                            }
                        }
                    }

                    Addresses.deleteAddress(addressId).then(function(response) {
                        if (address) {
                            address.showOverlay = true;
                            //  no countdown necessary, row is being deleted...
                        }

                        $timeout(function() {
                            $scope.addresses = _.reject($scope.addresses, function(el) {
                                return el.id === addressId;
                            });
                            $scope.addressCount -= 1;

                            // update the profile copy - since we have now saved
                            $scope.master = angular.copy($scope.addresses);
                            $scope.editMode = false;
                            $scope.addMode = false;

                            $scope.refresh();
                        }, 2000);

                    }, function(error) {
                        $scope.isLoading = false;
                        console.log('error deleting address', error);
                        $scope.errorMsg = $translate.instant('ADR_DELETE_ERROR');
                        if (address) {
                            address.showOverlay = true;
                        }
                        countDownOverlay(address);
                    });
                };

                /*  Address selected, broadcast to listeners */
                $scope.addressSelected = function(address) {
                    Addresses.setCurrentAddress(address);
                    $rootScope.$broadcast('addressSelectionChanged', {
                        selAddress: address
                    });
                    $rootScope.back();
                };

                /*  Address selected, broadcast to listeners */
                $scope.addressSelectedInline = function(address) {
                    Addresses.setCurrentAddress(address);
                    $rootScope.$broadcast('addressSelectionChanged', {
                        selAddress: address
                    });
                };

                $scope.validate = {
                    nameold: /^[-a-zA-Z][-'a-zA-Z]+,?[\s'.][-'a-zA-Z]{0,19}$/,
                    name: /^[a-zA-Z]+\s[0-9a-zA-Z .,'-]*$/,
                };

                $scope.prompt = function(p, wclass, template, controller) {
                    var p = $modal.open({
                        windowClass: wclass,
                        templateUrl: template,
                        controller: controller,
                        animation: true,
                        size: 'sm',
                        resolve: {
                            prompt: function() {
                                return p;
                            }
                        }
                    });
                };

                var countDownOverlay = function (item) {
                    //  2 seconds
                   $timeout(function() {
                        item.showOverlay = false;
                    }, 2000);
                };

                var getAddressById = function (addressId) {
                    var foundAddress = null;
                    angular.forEach($scope.addresses, function(address) {
                        if (address.addressId === addressId) {
                            foundAddress = address;
                        }
                    });

                    return foundAddress;
                };
            }
        };
    });
