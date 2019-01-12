'use strict';

angular.module('stpls').directive('starRating', function($filter) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'modules/reviews/directives/starRating.html',
        scope: {
            rating: '@starRating',
            ratingCount: '@',
            ratingRange: '@'
        },
        link: function($scope, $elem, $attr) {
            $scope.$watch('rating', function() {
                //parse inputs
                var value = parseFloat($scope.rating) || 0,
                    count = parseInt($scope.ratingCount) || 0,
                    range = parseInt($scope.ratingRange) || 5;
                $scope.ratingShow = $scope.$eval($attr.ratingShow);
                $scope.countShow = $attr.countShow === 'false' ? false : true;

                //define range max then incremntal array
                $scope.max = range;
                $scope.range = Array.apply(null, {
                    length: range
                }).map(function(e, i) {
                    return i + 1;
                });


                $scope.val = value = $filter('ratingValue')(value, range);

                //normalize to 0.5 decimal rounding
                $scope.final = (Math.round(value * 2) / 2);

                //enable count
                if ($attr.ratingCount) {
                    $scope.c = true;
                    $scope.count = count;
                }else{
                    $scope.c = false;
                    $scope.count = 0;
                }
                //MWINHS-1630 If review count is -1 then review display as blank.
                if($scope.rating === '-1'){
                    $scope.c = false;
                    $scope.count = 0;
                }
            });

            //element modifier
            $scope.bem = $attr.ratingIconBem;
        }
    };
});
