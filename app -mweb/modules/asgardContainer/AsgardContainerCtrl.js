'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:AsgardContainerCtrl
 */
angular.module('stpls')
    .controller('AsgardContainerCtrl', function ($scope, $stateParams, $rootScope, $state, $timeout, $compile, $interval, $window, $ocLazyLoad, Config, Asgard) {


        var init = function () {

            $scope.$parent.overlay_loading = true;

            $scope.view = {

                name: $state.current.name,
                params: $stateParams,

                loaded: false,
                error: false

            };

            Asgard.getView($scope.view.name, $scope.view.params).then(function (resp) {

                var container = document.getElementsByClassName('main_area')[0];

                var asgardAssetPrefix = Config.getProperty('asgard').assetEnvironment;

                $ocLazyLoad.load([
                    asgardAssetPrefix + resp.jsSrc,
                    asgardAssetPrefix + resp.cssSrc
                ], {
                    cache: false
                }).then(function () {


                    $scope.$parent.overlay_loading = false;

                    container.innerHTML = resp.HTML;


                });


            });


        };


        init();

});
