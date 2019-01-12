'use strict';

angular.module('stpls')
  .directive('inputResetControl', function($compile, $timeout, Device) {
    var template = '<span class="input-reset animated fadeInRight"><i class="close_btn_sm"></i></span>';
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function($scope, $elem, $attr, ngModelCtrl) {

        //build UI
        var $control = angular.element(template);
        $elem.parent().append($control);
        $compile($control)($scope);
        $elem.parent().css({
          position: 'relative'
        });

        //bind event handling
        $elem.on('focus keypress', function(e) {
          if (e.type === 'focus') {
            $elem[0].select();
          }
          $timeout(toggle.bind(null, 1));
        }).on('blur', function() {
          $timeout(toggle.bind(null, 0));
        });


        $control.on('touchstart mousedown click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          $elem.val('');
          ngModelCtrl.$setViewValue('');
          ngModelCtrl.$modelValue = '';
          ngModelCtrl.$setPristine();
          toggle(0);

          var cb = $attr.inputResetControl;
          if (cb) {
            $timeout(function() {
              $scope.$eval(cb);
            });
          }
        });

        //state
        var toggle = function(show) {
          $control[(show && ngModelCtrl.$viewValue ? 'addClass' : 'removeClass')]('active');
        };

        toggle(0);

      }
    };
  });
