'use strict';

angular.module('stpls').directive('expDate', ['$filter', '$browser', function($filter, $browser) {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function($scope, $element, $attrs, ngModelCtrl) {
          var now = new Date();
          $element[0].type = 'tel';

          var isDateValid = function(isValid, dateValue) {

            //  Compare dates to the 1st of the next month
            var ccMonth = parseInt(dateValue.slice(0,2)) + 1;
            var ccYear  = parseInt(dateValue.slice(3,5));
            if (ccMonth > 12) {
                ccMonth = 1;
                ccYear++;
            }
            //  Month is 0-based
            ccMonth--;
            var ccDate = new Date('20' + ccYear, ccMonth.toString());
            if (ccDate < now) {
                isValid = false;
            }
            return isValid;
         };

          var listener = function() {
                var value = $element.val().replace(/[^0-9\/]/g, '');
                value = $filter('expdte')(value, false);
                $element.val(value);
                var isValid = (/^(0[1-9]|1[0-2])\/(1[6-9]|2[0-9])$/).test((value || '').replace(/^\/\+/, ''));
                if (isValid) {
                    isValid = isDateValid(isValid, value);
                }
                ngModelCtrl.$setValidity('expiry', isValid);
              };

            // This runs when we update the text field
            ngModelCtrl.$parsers.push(function(viewValue) {
                var testValue = viewValue.replace(/[^0-9\/]/g, '').slice(0,7);
                if (testValue === '') {
                    return undefined;
                }
                return testValue;
            });

            // This runs when the model gets updated on the scope directly and keeps our view in sync
            ngModelCtrl.$render = function(event) {
                $element.val($filter('expdte')(ngModelCtrl.$viewValue, false));
                 var isValid = (/^(0[1-9]|1[0-2])\/(1[6-9]|2[0-9])$/).test((ngModelCtrl.$viewValue || '').replace(/^\/\+/, ''));
                 if (isValid) {
                    if (isValid) {
                        isValid = isDateValid(isValid, ngModelCtrl.$viewValue);
                    }
                }

                 ngModelCtrl.$setValidity('expiry', isValid);
             };

            $element.on('change blur', listener).on('keydown', function(event) {
                var key = event.keyCode;
                // If the keys include the CTRL, SHIFT, ALT, or META keys, or the arrow keys, do nothing.
                // This lets us support copy and paste too
                if (key === 91 || (15 < key && key < 19) || (37 <= key && key <= 40)){
                    return;
                }
                $browser.defer(listener); // Have to do this or changes don't get picked up properly
            });

            $element.on('paste cut', function(event) {
                if (event.type === 'paste') {
                    var test = event.clipboardData.getData('Text');
                    ngModelCtrl.$modelValue = event.clipboardData.getData('Text');
                    $scope.$apply();
                }
                $browser.defer(listener);
            });
        }
    };

}]).filter('expdte', function () {
    return function (expdte) {
        if (!expdte || expdte === undefined) { return ''; }

        //var value = expdte.toString().trim().replace(/^\/\+/, '');
        var value = expdte;
        if (value.match(/[^0-9\/]/)) {
            return expdte;
       }

        var month, year;
        //  see if user only entered 1 digit month
        var idx = String(value).indexOf('/');
        if (idx === 1) {
            value = '0' + String (value);      //  add lead 0;
        }
        var value = value.toString().trim().replace(/\//g, '');
        month = value.slice(0, 2);
        year = value.slice(2);

        if (year) {
            if (year.length > 2) {
                year = value.slice(2);
            }
            else {
                year = year;
            }
            if (year.length === 4) {
                year = year.slice(2);
            }
            return (month + '/'  + year).trim();
        }
        else{
            return expdte;
        }
    };
 });
