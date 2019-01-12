'use strict';

angular.module('stplsSeo', ['stplsTranslate', 'seo.meta', 'seo.quartz', 'seo.pumice', 'seo.sanitizer'])
  .factory('Seo', ['Quartz', 'Pumice', 'Sanitizer', function(Quartz, Pumice, Sanitizer) {
    return {
      quartz: Quartz,
      pumice: Pumice,
      sanitizer: Sanitizer
    };
  }])
  .run(['$rootScope', 'Seo', function($rootScope, Seo) {
    // expose to templates as $root.SEO
    $rootScope.SEO = Seo;
  }])
  .directive('seoHomeCopy', ['$document', '$timeout', function($document, $timeout) {
    return {
      restrict: 'E',
      replace: true,
      template: '<span class="small seo-home-copy" translate="HOME_DESC"></span>',
      link: {
        post: function($scope, $elem) {
          $scope.$watch(function() {
            // This is done to support injection into cached page container (isomorphic)
            return $document[0].querySelector('.copyright');
          }, function(target) {
            if (target) {
              angular.element(target).append($elem);
            }
          });
          //cleanup
          $scope.$on('$destroy', function() {
            $timeout($elem.remove.bind($elem));
          });
        }
      }
    };
  }])
  .directive('seoMetaDescription', function() {
    return {
      restrict: 'AE',
      replace: true,
      template: '<meta name="description" ng-if="seo.description">',
      compile: function(element) {
        element.attr('content', '{{seo.description}}');
      }
    };
  })
  .directive('seoCanonical', function() {
    return {
      restrict: 'AE',
      replace: true,
      template: '<link rel="canonical" ng-if="seo.canonical"/>',
      compile: function(element) {
        element.attr('href', '{{seo.canonical}}');
      }
    };
  })
  .directive('seoPagePrev', function() {
    return {
      restrict: 'AE',
      replace: true,
      template: '<link rel="prev" ng-if="seo.prev"/>',
      compile: function(element) {
        element.attr('content', '{{seo.prev}}');
      }
    };
  })
  .directive('seoPageNext', function() {
    return {
      restrict: 'AE',
      replace: true,
      template: '<link rel="next" ng-if="seo.next"/>',
      compile: function(element) {
        element.attr('content', '{{seo.next}}');
      }
    };
  });
