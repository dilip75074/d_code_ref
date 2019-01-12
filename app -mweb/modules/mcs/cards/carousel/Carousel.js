'use strict';

angular.module('stpls')
    .directive('mcsCarousel', function($window, stplsRouter) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                data: '='
            },
            templateUrl: 'modules/mcs/cards/carousel/Carousel.html',
            link: function($scope, element, attrs) {
                $scope.interval = 6 * 1e3;
                $scope.bannerClick = function($event, slide) {
                    if(slide.couponCode||slide.partNumber){
                        $event.preventDefault();
                        stplsRouter.go('addtocart',{
                            URL: slide.contentSourceUrl,
                            promoName:slide.couponCode,
                            sku:slide.partNumber||slide.sku,
                            qty:slide.partQty||slide.qty||1
                        });
                    }else{
                        if(slide.contentSourceUrl){
                            stplsRouter.toHref(slide.contentSourceUrl);
                        }
                    }
                };

                $scope.parseProtocol = function(url) {
                  var urlData = new URL(url);

                  url = url.split(urlData.protocol)[1];

                  return url;
                }
            }
        };
    });
