'use strict';

angular.module('stplsDeals', ['stplsTranslate'])
  //singleton DealsUtil for processing times
  .factory('DealsUtil', ['$rootScope', '$interval', function($rootScope, $interval) {
    var _offset = 0, //difference between server and browser time in seconds
        _registry = {},
        api;

    var onesecEvent = 'clock.second',
        oneminEvent = 'clock.minute',
        onesec = 1e3,
        onemin = onesec * 60,
        tic, tock;

    //create pulses at the $rootScope level (once)
    function tick(){
      api.processRegistry(); //singleton
      $rootScope.$broadcast(onesecEvent);
    }
    function tickmin(){
      api.processRegistry(true); //singleton
      $rootScope.$broadcast(oneminEvent);
    }

    api = {
      parseDate: function(val){
        if(val){
          val = '' + val;
          val = val.length && val.match(/^\d+$/) ? parseInt(val) : val;
          return new Date(val);
        }
        return new Date();
      },
      rebase: function(serverTime) {
        _offset = Math.round((this.parseDate(serverTime).getTime() - this.clientTime())/1e3);
        return this; //for chaining on auto init
      },
      getOffset: function(){
        return _offset;
      },
      clientTime: function(){
        return new Date().getTime();
      },
      serverTime: function(){
        return this.clientTime() + this.getOffset() * onesec;
      },
      secondsUntil: function(expiration){
        var d = (angular.isDate(expiration) ? expiration : this.parseDate(expiration));
        var s = Math.floor((d.getTime() - this.serverTime())/onesec);
        return s > 0 ? s : 0;
      },
      //api for handling timers
      registerDate: function(key){
        if(key && !_registry[key]){
          var d = this.parseDate(key);
          _registry[key] = {
            date: d,
            timeUntil: this.computeUntil(d)
          };

          if(!tic) {tic = $interval(tick, onesec);}
          if(!tock) {tock = $interval(tickmin, onemin);}
        }
      },
      processRegistry: function(force){
        var that = this;
        angular.forEach(_registry, function(obj){
          if(force || !obj.timeUntil.days){
            obj.timeUntil = that.computeUntil(obj.date);
            //TODO: garbage collection on expired dates
          }
        });
      },
      computeUntil: function(date) {
        var remaining = this.secondsUntil(date);
        var minutes = Math.floor(remaining / 60);
        var hours = Math.floor(minutes / 60);
        var days = Math.floor(hours / 24);
        minutes %= 60;
        hours %= 24;
        return {
          total: remaining,
          seconds: remaining % 60,
          minutes: minutes,
          hours: hours,
          days: days
        };
      },
      timeUntil: function(key){
        return (_registry[key] || {}).timeUntil;
      },
      eachSecond: function($scope, cb){
        $scope.$on(onesecEvent, cb || angular.noop);
        return this;
      },
      eachMinute: function($scope, cb){
        $scope.$on(oneminEvent, cb || angular.noop);
        return this;
      }
    }
    //auto rebase
    .rebase();

    return api;
  }])

  .directive('dealTimer', ['$compile','DealsUtil',function($compile, DealsUtil){

    return {
          restrict: 'EA',
          scope:{
            expires: '@dealTimer', //expiration in millis or ISO
            timerProduct: '=',
            timerFinish: '='   //callback on expiration
          },
          replace: false,
          controller: ['$scope','$element','$timeout',function($scope, $el, $timeout) {

            if(!$scope.expires) {
              $el.empty();
              return;
            }

            $el.addClass('deal-timer');
            $compile($el.contents())($scope);

            $scope.$watch('expires', function(v) {
                DealsUtil.registerDate(v); //singleton timers
                update();
            });

            function tick(){
              if(!$scope.days){
                update();
              }
            }

            function update(){
              var until = DealsUtil.timeUntil($scope.expires) || {};
              //digest total, days, hours, minutes, seconds
              angular.forEach(until, function(val, key){
                $scope[key] = val;
              });
              //handle expiration & warning notifs
              if($scope.total <= 0){
                ($scope.timerFinish || angular.noop)($scope.timerProduct);
                $el.remove();
                $timeout(function(){
                  $scope.$destroy();
                });
              }
            }

            //register callbacks to the singleton clock
            DealsUtil.eachSecond($scope, tick)
              .eachMinute($scope, update);

          }]
        };
      }]);
