'use strict';

angular.module('stpls')
    .directive('changePassword', function() {
        return {
            restrict: 'E',
            scope: {
                passwordOpen: '=passwordOpen'
            },
            templateUrl: 'modules/profile/directives/changePassword.html',
            controller: function($scope, Profile) {

                $scope.errorMsg = '';
                $scope.logonPasswordOld = '';
                $scope.logonPassword = '';
                $scope.logonPasswordVerify = '';

                // initial form state
                $scope.submitted = false;

                $scope.save = function(form) {
                    $scope.submitted = true;
                    if (form.$valid) {
                        Profile.changePassword($scope.logonPasswordOld, $scope.logonPassword, $scope.logonPasswordVerify).then(function(response) {
                            $scope.resetForm(form);
                            $scope.passwordOpen = false; // tell parent to close us
                        }, function(error) {
                            $scope.errorMsg = error;
                            form.logonPasswordOld.$valid = false;
                            $scope.logonPasswordOld = '';
                        });
                    }
                };

                $scope.interacted = function(field) {
                    return $scope.submitted || field.$dirty;
                };

                $scope.resetForm = function(form) {
                    if (form) {
                        form.$setPristine();
                        form.$setUntouched();
                    }
                    $scope.logonPassword = '';
                    $scope.logonPasswordOld = '';
                    $scope.logonPasswordVerify = '';
                    $scope.errorMsg = '';
                    $scope.submitted = false;
                };

                $scope.cancel = function(form) {
                    $scope.resetForm(form);
                    $scope.passwordOpen = false;
                };

                $scope.resetForm();
            }
        };
    }).directive('matchValidator', function() {
        return {
            require: 'ngModel',
            link: function(scope, element, attrs, ngModel) {
                ngModel.$parsers.push(function(value) {
                    ngModel.$setValidity('match', value === scope.$eval(attrs.matchValidator));
                    return value;
                });
            }
        };
    });


