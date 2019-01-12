'use strict';

/**
 * @ngdoc function
 * @name stpls.controller:RewardsCheckCtrl
 */
angular.module('stpls')
    .controller('RewardsCheckCtrl', function ($scope, $rootScope, $modalInstance, prompt) {

        $scope.p = prompt;
        if ($scope.p.actions == undefined) {
           $scope.p.actions = {};
        }

        // Setup col size for actions btns
        if ($scope.p.actions.primary && $scope.p.actions.secondary) {
            $scope.action_col = 6;
        }
        else {
            $scope.action_col = 12;
        }

        if ($scope.p.autoclose != undefined) {
			setTimeout(function() {
                $scope.close();
           }, $scope.p.autoclose);
        }

        $scope.path = function(btn) {
			$scope.close();

            if (btn.reload) {
                $rootScope.reload();
            }
            else if (btn.callback) {
                btn.callback();
            }
            else if (btn.route) {
				setTimeout(function() {
					$rootScope.toRoute(btn.route);
                }, 500);
            }
 	};


	$scope.ok = function () {
		$modalInstance.close($scope.selected.item);
 	};

	$scope.close = function () {
		$modalInstance.dismiss('cancel');
	};

});