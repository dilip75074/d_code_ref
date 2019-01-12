/* ng-infinite-scroll - v1.0.0 - 2014-01-02 */
stpls.directive('infiniteScroll', [
  '$rootScope', '$window', '$timeout', '$parse', function($rootScope, $window, $timeout, $parse) {
    return {
      link: function(scope, elem, attrs) {
        var checkWhenEnabled, handler, scrollDistance, scrollEnabled, topPageHeight, isTopPage;
        isTopPage = true;
        var containerElement = document.getElementsByClassName('page-container')[0];
        $window = angular.element(containerElement);
        scrollDistance = 0;
        if (attrs.infiniteScrollDistance != null) {
          scope.$watch(attrs.infiniteScrollDistance, function(value) {
            return scrollDistance = parseInt(value, 10);
          });
        }
        scrollEnabled = true;
        checkWhenEnabled = false;
        if (attrs.infiniteScrollDisabled != null) {
          scope.$watch(attrs.infiniteScrollDisabled, function(value) {
            scrollEnabled = !value;
            if (scrollEnabled && checkWhenEnabled) {
              checkWhenEnabled = false;
              return handler();
            }
          });
        }

        var updateModel = function(attrs, val) {
          if (attrs.infiniteScrollTopPage != null) {
            var topPageModel = $parse(attrs.infiniteScrollTopPage);

            if (topPageModel) {
              topPageModel.assign(scope, val);
            }
          }
        };

        updateModel(attrs, isTopPage);

        handler = function() {
          var element = elem[0],
            elementBottom = element.offsetTop + element.clientHeight,
            remaining,
            shouldScroll,
            container = $window[0],
            scrollY = (container.scrollTop),
            windowBottom = document.documentElement.clientHeight + scrollY,
            remaining = elementBottom - windowBottom,
            shouldScroll = scrollY && element.clientHeight && remaining <= container.offsetHeight * scrollDistance;

          if (!topPageHeight) {
            topPageHeight = elementBottom;
          }
          else {
            var inTopPage = windowBottom <= topPageHeight;
            if (inTopPage != isTopPage) {
              isTopPage = inTopPage;
              updateModel(attrs, isTopPage);
            }
          }

          if (shouldScroll && scrollEnabled) {
            if ($rootScope.$$phase) {
              return scope.$eval(attrs.infiniteScroll);
            } else {
              return scope.$apply(attrs.infiniteScroll);
            }
          } else if (shouldScroll) {
            return checkWhenEnabled = true;
          }
        };
        $window.on('scroll', handler);
        scope.$on('$destroy', function() {
          return $window.off('scroll', handler);
        });
        return $timeout((function() {
          if (attrs.infiniteScrollImmediateCheck) {
            if (scope.$eval(attrs.infiniteScrollImmediateCheck)) {
              return handler();
            }
          } else {
            return handler();
          }
        }), 0);
      }
    };
  }
]);
