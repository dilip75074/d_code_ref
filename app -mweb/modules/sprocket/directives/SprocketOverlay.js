'use strict';
// simple sprocket overlay
// - no script injection
// - no $compile
// TODO: leverage reusable Ctrl for this
angular.module('stplsSprocket')
  .directive('sprktOverlay', function(Sprocket) {
    return {
      restrict: 'A',
      templateUrl: 'modules/sprocket/views/overlay.html',
      scope: {
        uri: '@sprktOverlay',
        title: '@sprktOverlayTitle',
        show: '=sprktShow',
      },
      link: function($scope) {

        var setBody = function(body) {
          $scope.body = (body && Sprocket.trust(body)) || '';
        };

        var clear = function() {
          return setBody('');
        };

        $scope.dismiss = function() {
          $scope.show = false;
        };

        $scope.$watch(function() {
          return $scope.show && $scope.uri;
        }, function(uri) {
          if (uri) {
            clear();
            Sprocket.getPage(uri).then(function(data) {
              //title
              $scope.title = $scope.title || (data.seo || {}).title || '';

              //body
              if (data.body && data.body.length) {
                setBody(data.body);
              }
            }, function(err) {
              $scope.error = err.message || err.statusText;
            });
          }
        });

      }
    };
  });
