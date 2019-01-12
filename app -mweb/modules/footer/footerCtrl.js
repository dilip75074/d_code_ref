'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:FooterCtrl
 */
angular.module('stplsFooter', [])
    .controller('FooterCtrl', function($scope) {
    })
    .directive('blankTarget', function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var show = scope.$eval(attrs.blankTarget);
                if (show) {
                    element.attr("target", "_blank");
                }
            }
        };
    });
