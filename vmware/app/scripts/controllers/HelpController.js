vrmUI.controller('HelpController', function($scope, $rootScope, $route, $filter, $translate){
    console.log('Help controller loaded');

    // Get the page context object
    $rootScope.pageContextObject = angular.copy($route.current.data);
    // Translate heading
    var headerKey = $rootScope.pageContextObject.pageTitle;
    $rootScope.pageContextObject.pageTitle = "";
    $translate(headerKey)
        .then(function (translatedValue) {
            $rootScope.pageContextObject.pageTitle = translatedValue;
        });
    console.log("Page Context Object for change password screen is: ");
    console.log($rootScope.pageContextObject);
});