vrmUI.directive('confirmpassword', [
	function() {
		var link = function($scope, $element, $attrs, ctrl) {
			var validate = function(viewValue) {
				var comparisonModel = $attrs.confirmpassword;
				if(!viewValue || !comparisonModel){
					// It's valid because we have nothing to compare against
					ctrl.$setValidity('confirmpassword', true);
				}

				// It's valid if both are equal
				if(viewValue == undefined || comparisonModel == undefined) {
					ctrl.$setValidity('confirmpassword', true);
				} else {
					ctrl.$setValidity('confirmpassword', (viewValue == comparisonModel) );
				}
				return viewValue;
			};

			ctrl.$parsers.unshift(validate);
			ctrl.$formatters.push(validate);

			$attrs.$observe('confirmpassword', function(comparisonModel){
				// Whenever the comparison model changes we'll re-validate
				return validate(ctrl.$viewValue);
			});

		};

		return {
			require: 'ngModel',
			link: link
		};

	}
]);