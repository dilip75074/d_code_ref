'use strict';

angular.module('stplsConveyor')
  .directive('conveyorBanner', function(WidgetFactory, stplsRouter) {
    return WidgetFactory.directive({
      templateUrl: 'modules/conveyor/widgets/banner/Banner.html',
      controller: ['$scope', function($scope) {
        $scope.$watch('config.interval', function(c) {
          $scope.interval = ((c && parseFloat(c)) || 5) * 1e3;
        });

        $scope.bannerClick = function($event, item) {
          // intercept auto-ATC
          if (item.couponCode || item.partNumber) {
            $event.preventDefault();
            stplsRouter.go('addtocart', {
              URL: encodeURIComponent(item.link),
              promoName: item.couponCode,
              sku: item.partNumber || item.sku,
              qty: item.partQty || item.qty || 1
            });
          } else {
            if(item.link) {
              stplsRouter.toHref(item.link);
            }
          }
        };
      }]
    });
  });
