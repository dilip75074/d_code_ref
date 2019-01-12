vrmUI.factory('applicationInterceptor', function($q, $location, $injector) {
    return {
        responseError: function(rejection) {
        	console.log("Inside response error interceptor with status code: "+rejection.status);
            if(rejection.status == 0) {
            	console.log("Inside application interceptor inside response error for 302");
            	// This is a 302 redirect .. in our application we need to assume its a session timeout
            	window.location.href = context;
            	return false;
            }
            return $q.reject(rejection);
        }
    };
});

vrmUI.config(function($httpProvider) {
    $httpProvider.interceptors.push('applicationInterceptor');
});

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}