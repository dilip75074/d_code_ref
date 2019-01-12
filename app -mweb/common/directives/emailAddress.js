'use strict';

angular.module('stpls')
    .directive('emailAddress', function($rootScope) {
        return {
            restrict: 'A',
            transclude: true,

            template: '<div ng-transclude></div>' +
                '<div ng-show="show_suggestions" class="suggestions">' +
                '<div ng-repeat="domainName in [\'gmail.com\', \'googlemail.com\', ' +
                    '\'yahoo.co.uk\', \'yahoo.com\', \'hotmail.com\', \'hotmail.co.uk\',' +
                    '\'live.com\', \'msn.com\', \'comcast.net\', \'sbcglobal.net\', \'verizon.net\',' +
                    ' \'facebook.com\', \'outlook.com\', \'att.net\', \'gmx.com\', \'icloud.com\',' +
                    '\'me.com\', \'mac.com\', \'aol.com\'] | filter: endUserEmail" ' +
                    'ng-click="domainSelected(domainName)" class="userSuggestion">' +
                '{{beginUserEmail}}@<span><strong>{{domainName}}</strong</span>' +
                '</div>' +
                '</div>',

            link: function($scope, $element, $attr, ngModelCtrl) {

                $scope.input = angular.element($element[0].getElementsByClassName('email')[0]);
                if (!$scope.input) {
                    console.log ('**** Developer Error:, add class \'email\' to the input tag to use this directive');
                    return;
                }
                $scope.inputModel = $scope.input.data('$ngModelController');
                $scope.beginUserEmail;
                $scope.endUserEmail;
                $scope.show_suggestions = false;
                $scope.save_show_suggestions = -1;

                var listener = function() {
                    //  E-Mail Validation
                    var emailvalid = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
                    var isValid = emailvalid.test($scope.inputModel.$viewValue);
                    $scope.inputModel.$setValidity($attr.ngModel, isValid);
                };

                // This runs when we update the text field
                $scope.inputModel.$parsers.push(function(viewValue) {
                    if (viewValue === '') {
                        return undefined;
                    }
                    return viewValue;
                });

                // This runs when the model gets updated on the scope directly and keeps our view in sync
                $scope.inputModel.$render = function() {
                    //  E-Mail Validation
                    var emailvalid = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
                    var isValid = emailvalid.test($scope.inputModel.$viewValue);
                    $scope.inputModel.$setValidity($attr.ngModel, isValid);
                    $scope.input[0].value = $scope.inputModel.$viewValue || '';
                };

                $element.on('focusin focus', function() {
                  $scope.$apply(function(){
                    if ($scope.save_show_suggestions === 1) {
                        $scope.show_suggestions = true;

                    } else if ($scope.save_show_suggestions === 0) {
                        $scope.show_suggestions = false;
                    }
                  });
                });

                $element.on('focusout', function() {
                  $scope.$apply(function(){
                    if ($scope.show_suggestions) {
                        $scope.save_show_suggestions = 1;
                    } else {
                        $scope.save_show_suggestions = 0;
                    }
                    $scope.show_suggestions = false;
                  });
                });

                $element.on('change', listener);
                $element.on('keypress', function(event) {
                    var key = event.keyCode;

                    var value = $scope.input.val();

                    //  Try and get the backend of the email address
                    var emailTest = value + String.fromCharCode(key);
                    var idx = emailTest.indexOf('@');
                    if (idx > 0) {
                        // Get the back part of user's email, like aol.com,
                        // used to filter dropdown list of domain names
                        $scope.endUserEmail = emailTest.substring(idx + 1);
                        $scope.beginUserEmail = emailTest.substring(0, idx);
                    }

                    $scope.show_suggestions = (idx >= 0);

                    // If the keys include the CTRL, SHIFT, ALT, or META keys, or the arrow keys, do nothing.
                    // This lets us support copy and paste too
                    if (key === 91 || (15 < key && key < 19) || (37 <= key && key <= 40)) {
                        return;
                    }
                });

                $scope.domainSelected = function(selectedDomain) {
                    var value = $scope.beginUserEmail + '@' + selectedDomain;
                    $scope.input[0].value = value;
                    $scope.inputModel.$viewValue = value;
                    $scope.inputModel.$commitViewValue();
                    $scope.inputModel.$render();

                    $scope.show_suggestions = false;
                    ($scope.dataChanged || angular.noop)();
                };
            },
        };

    });
