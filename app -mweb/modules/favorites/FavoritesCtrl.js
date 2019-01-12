'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:FavoritesCtrl
 * @desc Favorite Lists
 */
angular.module('stpls')
   .controller('FavoritesCtrl', function ($scope, $rootScope, Favorites) {

       $scope.favorites = [];

       Favorites.getFavoriteLists().then(function(result) {
            angular.forEach(result, function(list) {
                list.checked = false; // default not checked
            });
            $scope.favorites = result;
            console.log('favorites', $scope.favorites);
       });

       $scope.selectedAll = function() {
           return _.every($scope.favorites, 'checked', true);
       };

       $scope.selectAll = function() {
           var newValue = ! $scope.selectedAll();
           angular.forEach($scope.favorites, function(list) {
               list.checked = newValue;
           });
       };

       $scope.openList = function(list) {
            $rootScope.toRoute('favoritedetails', {id: list.listId});
       };

       $scope.createList = function(listName) {
           Favorites.createList(listName).then(function(result) {

           });
       };

       $scope.deleteList = function(list) {
           Favorites.deleteList(list).then(function(result) {

           });

       };

});

