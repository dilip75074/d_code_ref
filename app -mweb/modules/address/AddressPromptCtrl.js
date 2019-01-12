'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:AddressPromptCtrl
 */
angular.module('stpls').controller('AddressPromptCtrl', function($scope, $rootScope, $modalInstance, $timeout, $translate, prompt, Addresses, GoogleMapLoader) {

    $scope.errorMsg = '';
    $scope.placeFound = false;
    $scope.place = false;

    $scope.p = prompt;
    if ($scope.p.actions == undefined) {
        $scope.p.actions = {};
    }

    if ($scope.p.editMode) {
        $scope.p.fullname = $scope.p.addressIn.first + ' ' + $scope.p.addressIn.last;

        var addr1, addr2, city, state, zip;
        if ($scope.p.addressIn.addressLine1) {
            addr1 = $scope.p.addressIn.addressLine1;
        } else {
            addr1 = '';
        }
        if ($scope.p.addressIn.addressLine2) {
            addr2 = ' ' + $scope.p.addressIn.addressLine2;
        } else {
            addr2 = '';
        }
        if ($scope.p.addressIn.city) {
            city = ', ' + $scope.p.addressIn.city;
        } else {
            city = '';
        }
        if ($scope.p.addressIn.state) {
            state = ', ' + $scope.p.addressIn.state;
        } else {
            state = '';
        }
        if ($scope.p.addressIn.zip) {
            zip = ' ' + $scope.p.addressIn.zip;
        } else {
            zip = '';
        }
        $scope.p.fulladdress = addr1 + addr2 + city + state + zip;
    } else {
        $scope.p.fullname = '';
        $scope.p.fulladdress = '';
    }

    $scope.$watch('expand', function(value) {
        if (!value) {
            $scope.p.fulladdress = buildFullAddress($scope.p.addressIn);
        }
    });

    var buildFullAddress = function(addressIn) {
        var addr1, addr2, city, state, zip;
        if (addressIn.addressLine1) {
            addr1 = addressIn.addressLine1;
        } else {
            addr1 = '';
        }
        if (addressIn.addressLine2) {
            addr2 = ' ' + addressIn.addressLine2;
        } else {
            addr2 = '';
        }
        if (addressIn.city) {
            city = ', ' + addressIn.city;
        } else {
            city = '';
        }
        if (addressIn.state) {
            state = ', ' + addressIn.state;
        } else {
            state = '';
        }
        if (addressIn.zip) {
            zip = ' ' + addressIn.zip;
        } else {
            zip = '';
        }
        return addr1 + addr2 + city + state + zip;
    };

    var addressInput;
    setTimeout(function() {
        addressInput = document.getElementById('addr_id');
        if (addressInput) {
            $scope.loadGooglePlaces(addressInput);
        }
    }, 500);

    $scope.loadGooglePlaces = function(addressInput) {
        var options = {
            componentRestrictions: { country: "us" }
        };

        GoogleMapLoader.loadGoogleMap(function() {
            var addrAutoComplete = new google.maps.places.Autocomplete(addressInput, options);

            /*  listener for address */
            google.maps.event.addListener(addrAutoComplete, 'place_changed', function() {
                $scope.$apply(function() {
                    $scope.placeFound = true;
                    var place = addrAutoComplete.getPlace();

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
                    $scope.p.fulladdress = $scope.place.addressLine1 + ' ' + $scope.place.city + ' ' + $scope.place.state + ' ' + $scope.place.zip;
                    $scope.p.addressIn.addressLine1 = $scope.place.addressLine1;
                    $scope.p.addressIn.addressLine2 = '';
                    $scope.p.addressIn.city = $scope.place.city;
                    $scope.p.addressIn.state = $scope.place.state;
                    $scope.p.addressIn.zip = $scope.place.zip;
                });
            });
        });
    };

    $scope.path = function(btn) {
        $scope.close();

        if (btn.reload) {
            $rootScope.reload();
        } else if (btn.callback) {
            btn.callback();
        } else if (btn.route) {
            setTimeout(function() {
                $rootScope.toRoute(btn.route);
            }, 500);
        }
    };

    $scope.ok = function() {
        $modalInstance.close($scope.selected.item);
    };

    $scope.close = function() {
        $modalInstance.dismiss('cancel');
    };

    $scope.save = function(address) {

        //  make sure manual entry form closed so we accept the address
        if ($scope.expand) {
            $scope.p.fulladdress = buildFullAddress($scope.p.addressIn);
            $scope.expand = false;
        }

        //  split name
        var first = '';
        var last = $scope.p.fullname;
        if ($scope.p.fullname === undefined) {
            address.first = '';
            address.last = '';
        }
        else if ($scope.p.fullname > '') {
            var idx = $scope.p.fullname.indexOf(' ');
            if (idx > 0) {
                //  this will take care of names like 'van damme'
                address.first = $scope.p.fullname.substring(0, idx).trim();
                address.last = $scope.p.fullname.substring(idx).trim();
            } else {
                address.first = '';
                address.last = $scope.p.fullname;
            }
        }

        if (address.phoneExt === undefined || address.phoneExt === null || address.phoneExt === '') {
            address.phoneExt = '';
        }

        $scope.errorMsg = '';
        var testFullAddress = buildFullAddress($scope.p.addressIn);
        testFullAddress = testFullAddress.replace (/,/g, '');

        if ($scope.p.fulladdress && $scope.p.fulladdress !== '') {
            $scope.p.fulladdress = $scope.p.fulladdress.replace (/,/g, '');
            $scope.p.fulladdress = $scope.p.fulladdress.replace (new RegExp('  ', 'g'), ' ');
        }

        //  Check for error conditions

        //  Make sure user either selected a google address --- or ---
        //  entered a formatted address in the dropdown form.
        //  User cannot just type a wild address in the input field.
        if (!$scope.p.addressIn.addressLine1 && !$scope.p.addressIn.city &&
            !$scope.p.addressIn.state && !$scope.p.addressIn.zip) {
            $scope.errorMsg = $translate.instant('ADR_INVALID_ADDRESSENTRY');
            document.addressEditForm.name.$valid = false;
        } else if (testFullAddress !== $scope.p.fulladdress) {
            $scope.errorMsg = $translate.instant('ADR_INVALID_ADDRESSENTRY');
            document.addressEditForm.name.$valid = false;
        } else {

            if (!$scope.p.addressIn.addressLine1) { $scope.p.addressIn.addressLine1 = ''; }
            if (!$scope.p.addressIn.addressLine2) { $scope.p.addressIn.addressLine2 = ''; }
            if (!$scope.p.addressIn.city) { $scope.p.addressIn.city = ''; }
            if (!$scope.p.addressIn.state) { $scope.p.addressIn.state = ''; }
            if (!$scope.p.addressIn.zip) { $scope.p.addressIn.zip = ''; }

            $scope.p.fulladdress = $scope.p.addressIn.addressLine1 + ' ' +
                $scope.p.addressIn.addressLine2 + ' ' +
                $scope.p.addressIn.city + ' ' +
                $scope.p.addressIn.state + ' ' +
                $scope.p.addressIn.zip;

            if ($scope.p.fulladdress && $scope.p.fulladdress !== '') {
               $scope.p.fulladdress = $scope.p.fulladdress.replace (new RegExp('  ', 'g'), ' ');
            }

            if ($scope.p.fulladdress === undefined || $scope.p.fulladdress === null || $scope.p.fulladdress === '') {
                address.addressLine1 = null; //  only need to catch the error at this level
            }

            if (address.first === undefined || address.first === null || address.first === '') { //  bad first name
                $scope.errorMsg = $translate.instant('ADR_INVALID_NAME');
                document.addressEditForm.name.$valid = false;
            } else if (!$scope.validate.name.test(address.first + ' ' + address.last)) {
                $scope.errorMsg = $translate.instant('ADR_INVALID_NAME');
                document.addressEditForm.name.$valid = false;
            } else if (address.last === undefined || address.last === null || address.last === '') { //  bad last name
                $scope.errorMsg = $translate.instant('ADR_INVALID_LAST');
                document.addressEditForm.name.$valid = false;
            } else if (address.addressLine1 === undefined || address.addressLine1 === null || address.addressLine1 === '') { //  bad line 1
                $scope.errorMsg = $translate.instant('ADR_INVALID_LINE1');
                document.addressEditForm.addrLine1.$valid = false;
            } else if (address.city === undefined || address.city === null || address.city === '') { //  bad city
                $scope.errorMsg = $translate.instant('ADR_INVALID_CITY');
                document.addressEditForm.city.$valid = false;
            } else if (address.state === undefined || address.state === null || address.state === '') { //  bad state
                $scope.errorMsg = $translate.instant('ADR_INVALID_STATE');
                document.addressEditForm.state.$valid = false;
            } else if (address.zip === undefined || address.zip === null || address.zip === '') { //  bad zip
                $scope.errorMsg = $translate.instant('ADR_INVALID_ZIP');
                document.addressEditForm.zip.$valid = false;
            } else if (address.phone === undefined || address.phone === null || address.phone === '') { //  bad phone
                $scope.errorMsg = $translate.instant('ADR_INVALID_PHONE');
                document.addressEditForm.phone.$valid = false;
            } else if (!$scope.validate.zipplus.test(address.zip)) {
                $scope.errorMsg = $translate.instant('ADR_INVALID_ZIP');
                document.addressEditForm.zip.$valid = false;
            }
        }

        if ($scope.errorMsg !== '') {
            // find the first invalid element
            var firstInvalid = document.addressEditForm.querySelector('.ng-invalid');
            // if we find one, set focus
            if (firstInvalid) {
                firstInvalid.focus();
            }
            return;
        }

        $scope.p.dir.setIsLoading();
        Addresses.saveAddress(address).then(function(response) {
            $scope.p.dir.refresh();
            $scope.close();
        }, function(error) {
            console.log("error saving address", error);
            $scope.errorMsg = $scope.handleErrorObject(error);
        });
    };

    $scope.cancel = function(form) {
        $scope.p.dir.cancelEdit(form);
        $scope.close();
    };

    $scope.validate = {
        zip: /^\d{5}?$/,
        zipplus: /^\d{5}(?:[-\s]\d{4})?$/,
        name: /^[a-zA-Z]+\s[0-9a-zA-Z .,'-]*$/,
        nameold: /^[-a-zA-Z][-'a-zA-Z]+,?[\s'.][-'a-zA-Z]{0,19}$/
    };

    $scope.handleErrorObject = function(error) {
        var msg = '';
        if (error.status === 404) {
            msg = 'Error calling url ' + error.config.url.toString() + '.  Not found.';
            return msg;
        }

        if (error.data && error.data.errorMessage) {
            msg = error.data.errorMessage;
        }

        if (msg.indexOf('zipCode') >= 0) {
            msg = 'Invalid zipcode. Please enter a valid zipcode.';
        } else if (msg.indexOf('state') >= 0) {
            msg = 'Invalid state code. Please enter a valid state code.';
        }
        return msg;
    };

});