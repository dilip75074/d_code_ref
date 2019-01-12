angular.module('stpls').directive('clickVisaCheckout', function(){
    return {
        restrict: 'A',
        scope: {
          cb: '=clickVisaCheckout'
        },
        link: function(scope, element, attr) {
            element.on('click', function(event){
                (scope.cb || angular.noop)();
            });
        }
    };
});