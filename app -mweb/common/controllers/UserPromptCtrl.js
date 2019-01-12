'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:UserPromptCtrl
 */
angular.module('stpls')
    .controller('UserPromptCtrl', function ($scope, $rootScope, $modalInstance, prompt) {



        $scope.p = prompt;


        if($scope.p.actions == undefined){

            $scope.p.actions = {};

        }


        // Setup col size for actions btns
        if($scope.p.actions.primary && $scope.p.actions.secondary){
            $scope.action_col = 6;
        }
        else {
            $scope.action_col = 12;
        }


        if ($scope.p.autoclose) {

            setTimeout(function(){
              if (!prompt.closed) {
                $scope.close();
              }
            }, $scope.p.autoclose);

        }

        $scope.path = function(btn){

            $scope.close();

            if(btn.reload){
                $rootScope.reload();
            }
            else if(btn.callback){
                btn.callback();
            }
            else if(btn.route) {

                setTimeout(function(){
                    $rootScope.toRoute(btn.route);

                }, 500);

            }



        };


        $scope.ok = function () {
            prompt.closed =  true;
            $modalInstance.close($scope.selected.item);
            (prompt.closeCallback || angular.noop)();
        };

        $scope.close = function () {
            prompt.closed =  true;
            $modalInstance.dismiss('cancel');
            (prompt.closeCallback || angular.noop)();
        };



});
