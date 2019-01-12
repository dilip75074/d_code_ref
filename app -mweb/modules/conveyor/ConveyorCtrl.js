'use strict';

angular.module('stplsConveyor')
  .controller('ConveyorCtrl', function($scope, $rootScope, $window, $document, $interval, $state, stplsRouter, Conveyor) {

    // if iframe (preview)
    if ($state.is('conveyor.preview') && $window.top !== $window.self) {
      // block navigation (within router anyway)
      $scope.$on('$stateChangeStart', function($event) {
        $event.preventDefault();
      });

      $window.addEventListener('message', function(event) {
        $scope.$apply(function() {
          try {
            $scope.template = JSON.parse(event.data);
          } catch (ex) {
            console.error('Error rendering preview:', ex);
            console.error('postMessage data:', event.data);
          }
        });
        $scope.$broadcast('postMessage', event.data);
      }, false);

    } else if ($state.params.slug) {
      // loader
      ($scope.$parent || {}).overlay_loading = true;

      Conveyor.getTemplate($state.params.slug).then(function(template) {
        // so easy
        $scope.template = template;
        // handle SEO
        if (template.meta && $rootScope.seo) {
          template.meta.canonical = template.meta.canonical || template.meta.canonicalUrl;
          template.meta.name = template.meta.title;
          angular.extend($rootScope.seo, template.meta);
        }
      }, function(nope) {
        stplsRouter.go('notfound', {
          error: nope && nope.status,
          msg: 'Page Not Found'
        }, {
          location: 'replace'
        });
      })['finally'](function() {
        // loader
        ($scope.$parent || {}).overlay_loading = false;
      });

    } else {
      // watch for $state.params.identifier for content-topper use
      $scope.$watch(function() {
        return $state.params.identifier;
      }, function(ident) {
        // console.log('CONVEYOR-PARTIAL', ident);
        Conveyor.getRouteContent(ident).then(function(template) {
          $scope.template = template;
        });
      });

    }

    // reduce template to direct props on scope
    var templateKey = 'template';
    $scope.$watch(templateKey, function(t) {
      // map template properties to the scope
      angular.forEach(t, function(v, k) {
        if (angular.isObject(v) && k !== templateKey) {
          $scope[k] = v;
        }
      });
    });
  });
