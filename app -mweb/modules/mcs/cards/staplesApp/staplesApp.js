'use strict';

angular.module('stpls')
    .directive('mcsStaplesApp', function($rootScope, Device) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                data: '='
            },
            templateUrl: 'modules/mcs/cards/staplesApp/staplesApp.html',
            link: function($scope, Device, element, attrs) {
                
                $scope.iOSDevice = false;
                $scope.androidDevice = false;
                if (device.ios() || device.ipad() || device.iphone() || device.ipod()) {
                    $scope.iOSDevice = true; //deviceIsIOS;
                }
                if (device.android() || device.androidPhone() || device.androidTablet()) {
                    $scope.androidDevice = true;
                }
                // console.log("Device Type: ", $scope.iOSDevice, $scope.androidDevice);

                $scope.appleStore = function() {
                    window.location = "https://itunes.apple.com/app/id376393873";
                };

                $scope.googlePlayStore = function() {
                    window.location = "https://play.google.com/store/apps/details?id=app.staples";
                };

            }
        };
    });
