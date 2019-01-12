'use strict';

angular.module('stpls')
  .directive('productCell', ['$rootScope', 'Product', 'Analytics', 'Seo', function($rootScope, Product, Analytics, Seo) {
    return {
      restrict: 'E',
      scope: {
        data: '=data',
        reviews: '=reviews',
        regPricing: '=regPricing',
        buy: '=buy'
      },
      templateUrl: 'modules/product/productCell/productCell.html',
      controller: function($scope, $element, $attrs, $rootScope, Product) {

        $scope.location = $attrs.loc || "";
        $scope.directToProduct = function(p){

          $rootScope.toRoute('product', {
            sku: p.sku,
            seo: Seo.quartz.sku(p).uri
          });

        };
      }
    };
  }]);
