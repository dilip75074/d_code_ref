vrmUI.factory('configurationInterceptor', function($q, $location, $injector) {
    return {
        request: function(config) {
            // TODO: Have a loading mask on the right content section
            // Check if its a config URL
            if (endsWith(config.url, ".html") && !endsWith(config.url, "error.html") && !endsWith(config.url, "physical-network-setup.html") && !endsWith(config.url, "network-config.html") && !endsWith(config.url, "ip-reallocation.html")) {
                console.log("This is a call to fetch the template. We will make our AJAX call over here to check the state of the product and redirect accordingly");
                console.log(config);
                // AJAX Call to check the status and redirect accordingly
                var deferred = $q.defer();
                $injector.invoke(function($http, HttpCommunicationUtil) {
                    HttpCommunicationUtil.doGet('security/configurationfilter/filter', function(data) {
                        console.log("Inside success for configuration filter");
                        if (data.status == "Success") {
                            if (null != data.object) {
                                if (endsWith(data.object, ".jsp")) {
                                    window.location.href = context + "/" + data.object;
                                    return false;
                                }
                                if (!endsWith(config.url, data.object + ".html")) {
                                    $location.url(data.object);
                                }
                            }
                        } else {
                            console.log("Inside error for configuration filter: server error");
                            $location.url("error");
                        }
                    }, function(data) {
                        console.log("Inside error for configuration filter");
                        $location.url("error");
                    });
                });
                deferred.resolve(config);
                return deferred.promise;
            } else {
                // do something on success
                return config || $q.when(config);
            }

        }
    };
});

vrmUI.config(function($httpProvider) {
    $httpProvider.interceptors.push('configurationInterceptor');
});

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}