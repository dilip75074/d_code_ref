'use strict';

/**
 * @ngdoc function
 * @name stpls.model:Favorites
 */
angular.module('stpls').factory('Favorites', function ($q, MobileService, Account) {

    // get the set of favorite 'lists'
    var getFavoriteLists = function () {
        var d = $q.defer();

        MobileService.request({
            method: 'GET',
            url: '/favorites',
            cache: false,
            params: {zip: Account.getZipCode(), aName: "getAll"}
        }).then(function (response) {
            var favorites = response.data;
            d.resolve(favorites);
        }, function (error) {
            console.log('error getting favorites', error);
            d.reject(error);
        });
        return d.promise;
    };

    var getFavoriteDetails = function (listId) {
        var d = $q.defer();

        MobileService.request({
            method: 'GET',
            url: '/favorites/' + listId,
            cache: false,
            params: {zip: Account.getZipCode()}
        }).then(function (response) {
            var favoriteDetails = response.data;
            d.resolve(favoriteDetails);
        }, function (error) {
            console.log('error getting favorite details', error);
            d.reject(error);
        });
        return d.promise;
    };

    return {
        getFavoriteLists: getFavoriteLists,
        getFavoriteDetails: getFavoriteDetails
    };

});

