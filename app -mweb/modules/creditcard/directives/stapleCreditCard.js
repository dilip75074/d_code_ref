'use strict';

angular.module('stpls').directive('stplsPaymentsValidate', ['$parse', function($parse) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, elem, attr, ctrl){

            var type = attr.stplsPaymentsValidate;

            var isStapleCreditCard = function(val) {

                ctrl.$setValidity(type, !!val);
                val = val || '';

                var pattern = /^(6035|7972|60111000|60111002)/;
                var ccNumber = val.replace(/[^0-9]/g, '');
                var typeModel = $parse(attr.stplsPaymentsTypeModel);
                var ccType = null;
                var valid = false;
                if (ccNumber.length === 0) {
                    valid = true;
                }
                else if (pattern.test(ccNumber)) {
                    ccType = 'staples';
                    valid = true;
                }

                if (typeModel) {
                    typeModel.assign(scope, ccType);
                }

                return val;
            };

           ctrl.$parsers.push(isStapleCreditCard);
           ctrl.$formatters.push(isStapleCreditCard);
        }
    };
}]);
