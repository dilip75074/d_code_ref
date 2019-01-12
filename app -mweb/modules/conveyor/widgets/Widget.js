'use strict';

angular.module('stplsConveyor')
  .factory('WidgetFactory', function($timeout) {
    return {
      directive: function(config) {
        config = config || {};
        return angular.extend({
          restrict: 'E',
          replace: true,
          scope: {
            widget: '='
          },
          compile: function compile(tElement, tAttrs, transclude) {
            return {
              pre: function preLink($scope, iElement, iAttrs, Ctrl) {

                // collect attribute-based configs (for nested widgets)
                var attrConfPrefix = 'widgetConfig';
                var iProps = {
                  config: {}
                };
                angular.forEach(iAttrs, function(val, key) {
                  if(key && key.indexOf(attrConfPrefix) === 0) {
                    key = key.replace(attrConfPrefix, '');
                    iProps.config[key] = val;
                    iProps.config[key.toLowerCase()] = val;
                  }
                });

                var widget = 'widget';
                $scope.$watch(widget, function(w) {
                  if(w.widget === 'invalid' || !w.widget) {
                    return;
                  }

                  // map widget properties to the scope
                  angular.forEach(w, function(v, k) {
                    if (k !== widget) {
                      $scope[k] = angular.isObject(v) ? angular.extend(v, iProps[k] || {}) : v;
                    }
                  });

                  if(w.config && (w.config.startDate || w.config.endDate)) {
                    var now = new Date();
                    var startDate = w.config.startDate ? new Date(w.config.startDate) : now;
                    var endDate = w.config.endDate ? new Date(w.config.endDate) : now;

                    if(endDate !== now && startDate > endDate) {
                      // invalid date range
                      w.widget = 'invalid';
                    } else if(now < startDate || now > endDate) {
                      // doesn't fit within the dates
                      w.widget = 'invalid';
                    }
                  }

                  if($scope && $scope.items) {
                    var items = angular.copy($scope.items);
                    items = items.filter(function(item) {
                      var now = new Date();
                      var startDate = item.startDate ? new Date(item.startDate) : now;
                      var endDate = item.endDate ? new Date(item.endDate) : now;
                      if(startDate > endDate) {
                        return false;
                      }
                      return (now >= startDate && now <= endDate);
                    });
                    $scope.items = items;
                  }
                });
              }
            };
          }
        }, config);
      }
    };
  })
  .directive('widgetCols', function() {
    return {
      restrict: 'A',
      link: function($scope, $elem) {
        var curr;
        $scope.$watch('config.columns', function(cols) {
          var cl = 'col-xs-' + (12 / (~~cols || 1));
          $elem.removeClass(curr).addClass(cl);
          curr = cl;
        });
      }
    };
  });
