'use strict';

/**
 * @ngdoc function
 * @name stpls.model:Addresses
 */
angular.module('stpls').factory('Addresses', function($q, $cookies, MobileService) {

    var currentAddress;

    var getCurrentAddress = function() {
        return currentAddress;
    };

    var setCurrentAddress = function(address) {
        currentAddress = address;
    };

    var getAddresses = function() {
        var d = $q.defer();

        var addresses = null;
        if (MobileService.getSessionState() !== 'registered') {
            d.reject();
        } else {
          MobileService.request({
              method: 'GET',
              url: '/profile/address',
              cache: false,
          }).then(function(response) {
              if (response.data) {
                  addresses = response.data.addresses;
              } else {
                  addresses = null;
              }
              d.resolve(addresses);

          }, function(error) {
              console.log('error getting addresses', error);
              d.reject(error);
          });
        }

        return d.promise;
    };

    /*
     * Save or Add address to user's profile
     */
    var saveAddress = function(address) {
        var d = $q.defer();

        var request = {
            url: '/profile/address',
            cache: false,
            data: address
        };

        if (address.addressId) {
            // address Id means we're editing an existing card
            request.method = 'PUT';
        } else {
            // else we're creating a new one so use POST
            request.method = 'POST';
        }

        MobileService.request(request).then(function(response) {
            d.resolve(response);
        }, function(error) {
            d.reject(error);
        });

        return d.promise;
    };

    /*
     * Delete address from user's profile
     */
    var deleteAddress = function(addressId) {
        var d = $q.defer();

        MobileService.request({
            method: 'DELETE',
            url: '/profile/address/' + addressId,
            cache: false,
        }).then(function(response) {
            console.log('address deleted: ', response);
            d.resolve(response);

        }, function(error) {
            console.log('error deleting address', error);
            d.reject(error);
        });

        return d.promise;
    };

    return {
        deleteAddress: deleteAddress,
        saveAddress: saveAddress,
        getAddresses: getAddresses,
        getCurrentAddress: getCurrentAddress,
        setCurrentAddress: setCurrentAddress
    };
});
