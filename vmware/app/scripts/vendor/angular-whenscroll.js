/*
This directive allows us to pass a function in on an enter key to do what we want.
 */
vrmUI.directive('ngWhenscroll', function () {
    return function (scope, elm, attrs) {
        var raw = elm[0];
        elm.bind('scroll', function() {
        	if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                scope.$apply(attrs.ngWhenscroll);
            }
        });
    };
});