'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:HelpCtrl
 */
angular.module('stpls')
    .controller('HelpCtrl', function($scope, $stateParams, $rootScope, $state, $timeout, $interval, $window, $modal, $translate, Help, InsideChat, Config, FBMessenger) {

    $scope.helpContent = false;
    $scope.helpSection = false;

    var init = function() {

        // Get help content
        var d = Help.getHelpContent();
        d.then(function(r) {
            $scope.helpContent = r.data;
            if ($state.current.name === 'termsandConditions') {
                InsideChat.trackerArticle($translate.instant('FT_TERMS'));
                $scope.helpSectionHeader = 'Policies & Legal';
                $scope.helpSection = $scope.helpContent['Policies & Legal'];
            } else {
                InsideChat.trackerArticle($translate.instant('SM_HELP'));
            }
        });

        $scope.FBMessengerEnabled = FBMessenger.enabled();
        $scope.FBMessengerUrl = FBMessenger.getMsgUrl();
    };

    init();

    $scope.openHelpSection = function(header, s) {

        window.scrollTo(0, 0);
        $scope.helpSectionHeader = header;
        $scope.helpSection = s;
    };
});
