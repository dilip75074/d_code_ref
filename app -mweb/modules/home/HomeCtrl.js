'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:HomeCtrl
 */
angular.module('stpls')
  .controller('HomeCtrl', function($scope, $window, $stateParams, Home, Conveyor, InsideChat) {
    var guestHomeVisted =  false;
    //show error
    if (!(/prod/).test($window.stpls_env)) {
      $scope.error = $stateParams.error && $stateParams.msg;
    }

    $scope.mcs = true;
    if (!$scope.mcs) {
      //this is fallback only when conveyor is not available
      $scope.mock = {
        slug: 'homepage',
        layout: [{
          widget: 'banner',
          config: {
            presentation: 'stacked'
          },
          items: [{
            imageUrl: "http://images.staples-3p.com/s7/is/image/Staples/53745_ios_960x840_inknlp?wid=960&hei=840",
            altText: "Unbeatable Ink & Toner prices",
            link: "/Ink-Toner-Finder/cat_SC43?icid=HP:MB:TOPHAT:NEWPRICES:INKANDTONER::201605018:",
            startDate: "2016-05-01 00:00 EST",
            endDate: "2017-06-25 00:00 EST"
          }, {
            imageUrl: "http://images.staples-3p.com/s7/is/image/Staples/55000_640x160?wid=640&hei=160",
            altText: "Exclusive Deal",
            link: "/deals/Buy-Now-Pick-Up-in-Store-Deals/BI1146948?icid=HP:MB:LPB:BOPISSAVE5PERCENT:PROMO:20160426&bannerurl=http%3A%2F%2Fimages.staples-3p.com%2Fs7%2Fis%2Fimage%2FStaples%2F55000_640x160%3Fwid%3D640%26hei%3D160"
          }]
        }, {
          widget: 'adplacement',
          config: {
            engine: 'hooklogic',
            locator: 'home',
            taxonomy: 'home',
            MaxAds: 1,
            pgn: 1,
            hlpt: 'H',
            creative: '150x375_M-C-OG_TI-1_1-1_AboveGrid1'
          }
        }, {
          widget: 'bundle',
          config: {
            format: 'deals',
            identifier: Home.getDealsBundle()
          }
        }]
      };

      // Utilize conveyor layout (when available)
      $scope.template = Conveyor.getPageCtx('homepage');
    }

    InsideChat.trackerHome();

  });
