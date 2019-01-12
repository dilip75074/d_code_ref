'use strict';

angular.module('stplsConveyor')
  .controller('ConveyorRefCtrl', function($scope, $http) {

    $http.get('config/conveyor_sample.json').then(function(resp){
      angular.forEach(resp.data, function(v, k){
        $scope[k] = v;
      });
    });

    $scope.configString = function(config) {
      return JSON.stringify(config, null, 2);
    };
    
    $scope.optionType = function(option) {
      return typeof option;
    };

  });
