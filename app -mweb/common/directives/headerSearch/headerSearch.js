'use strict';

angular.module('stplsTemplates') //use stplsTemplates to leverage isomorphic
  .directive('headerSearch', function() {
    return {
      restrict: 'E',
      scope: {
        overlay: '=',
        position: '@'
      },
      templateUrl: 'common/directives/headerSearch/headerSearch.html',
      controller: 'HeaderSearchCtrl'
    };
  })
  .directive('focusSearch', [
    '$rootScope',
    function ($rootScope) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var id = attrs.focusSearch;

                element.on('click', function (event) {
                  var $inputSearchElement = angular.element(document.querySelector('#' + id));

                  $rootScope.show_search = true;
                  $inputSearchElement.triggerHandler('touchstart');
                  scope.$apply();
                });
            },
            controller: 'HeaderSearchCtrl'
        };
    }
]).directive('blurSearch', [
  '$rootScope',
  function ($rootScope) {
      return {
          restrict: 'A',
          link: function (scope, element, attrs) {
            var headerSearchState = attrs.viewState;

            element.on('click', function (event) {
              $rootScope.show_search = false;
              scope.$apply();
            });
          },
          controller: 'HeaderSearchCtrl'
      };
  }
]).directive('focusMeHack', [
  '$rootScope',
  function ($rootScope) {
      return {
          restrict: 'A',
          link: function (scope, element, attrs) {
              element.on('touchstart', function (event) {
                $(this).focus();
              });
          },
          controller: 'HeaderSearchCtrl'
      };
  }
]).directive('searchSubmit', [
  '$rootScope',
    function ($rootScope) {
      return {
        restrict: 'A',
        link: function (scope, element, attrs) {
          var textFields = element.find('input');

           element.on('submit', function(event) {
             textFields[0].blur();
             $rootScope.show_search = false;
             scope.directToClassWithTerm();
             scope.$apply();
           });
         },
         controller: 'HeaderSearchCtrl'
    };
  }
]).directive('keywordSelect', [
  '$rootScope',
  function ($rootScope) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        element.on('click', function(event) {
          var keyword = element[0].dataset.keyword;

          $rootScope.show_search = false;
          scope.directToClassWithTerm(keyword);
          scope.$apply();
        });
      },
      controller: 'HeaderSearchCtrl'
    };
  }
]);
