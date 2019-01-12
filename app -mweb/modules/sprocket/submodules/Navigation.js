'use strict';

angular.module('stplsNavigation', ['stplsSprocket', 'stplsRouter', 'ui.tree'])
  .factory('Navigation', function(Sprocket) {
    return {
      getNav: function() {
        // nav tree ships in page source within sprocket model
        return Sprocket.getContent('nav');
      }
    };
  })
  .directive('navigationTree', function($http, $translate, $timeout, $window, Navigation, stplsRouter) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'modules/sprocket/views/navTree.html',
      scope: {
        navItem: '@',
        collapsed: '@',
        wait: '@'
      },
      controller: ['$scope', '$rootScope', function($scope, $rootScope) {
        var _each = angular.forEach;
        var navItem = $scope.navItem;
        var allowDepth = 2;

        // key method to preserve device performance
        $scope.allowDepth = function() {
          return $window._isomorphic ? Infinity : allowDepth;
        };

        var apply = function(nav) {
          if (nav) {
            var topNode = angular.copy(nav[navItem]);
            if (topNode) {
              if (navItem === 'category') {
                topNode.label = $translate.instant('NAV_CAT');
              }
              topNode.top = true;
              topNode.collapsed = $scope.collapsed !== 'false';
              topNode.navItem = $scope.navItem;
              $scope.tree = [topNode];
              return true;
            }
          }
          return false;
        };

        // so easy with sprocket data in window
        var good = apply(Navigation.getNav());

        //working locally, we have no sprocket - so we do this instead
        if (!good) {
          $http.get('config/sprocket_nav_sample.json').then(function(resp) {
            apply(resp.data.nav);
          });
        }

        $scope.toggleItem = function(item, $event) {

          // no bubbles
          document.activeElement.blur();
          $event.stopPropagation();
          $event.preventDefault();

          var m = item.$modelValue;
          if (m.items && m.items.length) {
            $timeout(function() {
              allowDepth++;
            });
            // item has children
            item.toggle();

            _each(item.siblings(), function(sibling) {
              if (sibling !== item) {
                sibling.hidden = !item.collapsed;
              }
            });

          } else if (!m.href) {
            // no children and no href...
            var p = item.$parentNodeScope.$modelValue;
            if (p && p.href) {
              stplsRouter.toHref(p.href);
              $rootScope.show_search = false;
            }

          } else {
            stplsRouter.toHref(m.href);
            $rootScope.show_search = false;
          }
        };
      }]
    };
  });
