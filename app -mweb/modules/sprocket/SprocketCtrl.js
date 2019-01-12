'use strict';

angular.module('stpls')
  .controller('SprocketCtrl', function($scope, $element, $rootScope, $window, $location, $timeout, $filter, $compile, $state, stplsRouter, Config, Sprocket, Coupons) {

    // loader
    ($scope.$parent || {}).overlay_loading = true;

    // main workflow
    Sprocket.getPage().then(function(data) {
      //seo
      $rootScope.seo = data.seo || $rootScope.seo;

      //content target
      var $target = $element.children().eq(0);
      $target = $target.length ? $target : $element;

      //body
      if (data.body && data.body.length) {
        var $html = angular.element(data.body);
        if ($html) {
          $target.append($html);
          $compile($html)($scope);
        } else {
          $scope.body = Sprocket.trust(data.body);
        }
      }

      //scripts
      Sprocket.addScripts(data.scripts || [], $target);

      ($scope.$parent || {}).overlay_loading = false;
    }, function(nope) {
      stplsRouter.go('notfound', {
        error: nope && nope.status,
        msg: nope && nope.statusText
      }, {
        location: 'replace'
      });
    });


    //register listeners for embedded content through "Hub"
    var Hub = Sprocket.hub;
    Hub.listen($scope, Hub.events.link, function($e, link) {
      // console.log('SPROCKET link', link);
      $e.preventDefault();
      if (link && link.path) {
        stplsRouter.toHref(link.path, link.query);
      } else if (angular.isString(link)) {
        stplsRouter.toHref(link);
      }
    });

    Hub.listen($scope, Hub.events.coupon, function($e, data) {
      // console.log('SPROCKET coupon', $e, data);
      if (data && data.coupon) {
        Coupons.addCouponToCart(data.coupon).then(function() {
          if (data.URL) {

          }
        });
      }

    });


  });
