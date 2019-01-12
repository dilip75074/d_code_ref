'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:FavoriteDetailsCtrl
 * @desc Show details of a single Favorite list
 */

angular.module('stpls')
    .controller('FavoriteDetailsCtrl', function ($scope, $rootScope, $stateParams, Favorites, Cart) {

    Favorites.getFavoriteDetails($stateParams.id).then(function(result) {
        angular.forEach(result, function(product) {
            product.checked = false; // default not checked
            product.qty = 1;
        });
        $scope.products = result;
        console.log('products', $scope.products);
    });

    $scope.changeQty = function(product, qty) {
        product.qty = product.qty + qty;
        // cant have quantity less than 1
        if (product.qty < 1) {
            product.qty = 1;
        }
    };

    $scope.selectedAll = function() {
        return _.every($scope.products, 'checked', true);
    };

    $scope.selectedAny = function() {
        return _.some($scope.products, 'checked', true);
    }

    $scope.selectAll = function() {
        var newValue = ! $scope.selectedAll();
        angular.forEach($scope.products, function(product) {
            product.checked = newValue;
        });
    };

    $scope.addToCart = function() {
        // filter out only checked products, and grab only the sku and qty properties
        var selectedProducts = _.reduce($scope.products, function(result, product) {
            if (product.checked) {
                result.push(_.pick(product, 'sku', 'qty'));
            }
            return result;
        }, []);

        //  Check for favorable conditions first
        angular.forEach(selectedProducts, function(product) {
            if (!Cart.canAddToCart(product, true)) {
                return;
            }
        });

        Cart.addItems(selectedProducts).then(function(result) {
            console.log('added products to cart', result);
            //TODO: add user modal/prompt here
        }, function(error) {
            console.log('error adding products to cart', error);
            //TODO: add user modal/prompt here
        });
    };

});

