'use strict';

/**
 * @ngdoc function
 * @name stpls.model:Soasta
 */
angular.module('stpls').run(['$rootScope', '$window', function($rootScope, $window) {

  var routeChange = false;
  var pgPrefix = ($window.aFeoApplied ? 'FEO-' : '');
  var hookAngularBoomerang = function() {
    var boom = $window.BOOMR || {};
    if (boom && boom.version) {
      if (boom.plugins && boom.plugins.Angular) {
        boom.plugins.Angular.hook($rootScope, routeChange);
      }
      return true;
    }
  };

  $rootScope.$on('$stateChangeStart', function(e, to) {
    routeChange = true;
    ($window.SOASTA || {}).pg = pgPrefix + (to.name || to.state);
  });
  if (!hookAngularBoomerang()) {
    if (document.addEventListener) {
      document.addEventListener('onBoomerangLoaded', hookAngularBoomerang);
    } else if (document.attachEvent) {
      document.attachEvent('onpropertychange', function(e) {
        e = e || window.event;
        if (e && e.propertyName === 'onBoomerangLoaded') {
          hookAngularBoomerang();
        }
      });
    }
  }
}]);
