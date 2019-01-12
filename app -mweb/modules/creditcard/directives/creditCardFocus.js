'use strict';

// credit card focus directive
angular.module('stpls').directive('creditcardFocus', function() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attr, ctrl) {

            element.on('focus', function(scope) {
                ctrl.$viewValue = ctrl.$modelValue;


                var parsers = ctrl.$parsers,
                    formatters = ctrl.$formatters,
                    viewValue = ctrl.$viewValue;

                // rerun parsers
                var idx = parsers.length;
                while (idx--) {
                    viewValue = parsers[idx](viewValue) || viewValue;
                }

                // rerun formatters
                idx = formatters.length;
                while (idx--) {
                    viewValue = formatters[idx](viewValue) || viewValue;
                }

                if (ctrl.$viewValue !== viewValue) {
                    ctrl.$viewValue = ctrl.$$lastCommittedViewValue = viewValue;
                    ctrl.$render();
                }
                if (scope.srcElement && scope.srcElement.classList && scope.srcElement.classList.contains('ng-invalid-card')) {
                    scope.srcElement.classList.add('ng-invalid');
                }
            });
        }
    };

}).directive('creditcardBlur', function() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attr, ctrl) {

            element.on('blur', function(scope) {

                var ccNum = ctrl.$modelValue;
                if (ccNum && ccNum.length > 0) {
                    var startPos = (ccNum.length - 4);
                    var last4 = '************ ' + ccNum.substring(startPos);
                    //  Make sure this doesn't show up as invalid cc
                    if (scope.srcElement && scope.srcElement.classList) {
                        scope.srcElement.classList.remove('ng-invalid');
                    }
                    ctrl.$viewValue = last4;
                    ctrl.$render();
                }
            });
        }
    };
});
