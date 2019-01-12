'use strict';

angular.module('stpls')
    .directive('reOrder', function() {
        return {
            restrict: 'E',
            replace: true,
            scope: true,
            templateUrl: 'modules/reOrder/reOrder.html',
            controller: ['$scope', 'MobileService', 'EZReorder', 'Product', function ($scope, MobileService, EZReorder, Product) {
                if (MobileService.getSessionState() !== 'registered') {
                    return;
                }

                EZReorder.getResults(null, 10, 1, 'ASC').then(function(data){
                    $scope.search_results = data.results;
                    angular.forEach($scope.search_results, function(p) {
                        Product.getPricing(p);
                    });
                });
            }]
        };
    });

