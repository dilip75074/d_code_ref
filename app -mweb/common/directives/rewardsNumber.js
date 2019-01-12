'use strict';

angular.module('stpls').directive('rewardsNumber', function() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attr, ctrl) {

            element.bind('blur', function(scope) {

                var str = ctrl.$viewValue;

                if (validate.number.test(str)) {
                    if (str.length > 1) {
                        while (str && str.length < 10) {
                            str = '0' + str;
                        }
                    }
                }

                ctrl.$viewValue = str;
                ctrl.$render();

            });

            var validate = {
                number: /^[0-9]+$/
            };
        }
    };
});
