'use strict';

angular.module('stpls')
    .directive('mcsWeeklyAd', function($q, MobileService, $rootScope) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                store: '=',
                data: '='
            },
            templateUrl: 'modules/mcs/cards/weeklyad/WeeklyAd.html',
            link: function($scope, element, attrs) {

                function CustomizeResolution(pages) {
                    if (pages) {
                        angular.forEach(pages, function(p){
                            p.img = p.img.replace(/\/\d+/,'/400');
                        });
                    }
                }

                $scope.changeStore = function() {
                    $rootScope.toRoute('displayStores', {
                        storeNo: $scope.store.store_number,
                        zip: $scope.store.store_address.zip
                    });
                };

                function init() {
                    var store_address = $scope.store.store_address;

                    $scope.cityAndDistance = store_address.city;

                    var storeNumber = ('' + $scope.store.store_number.replace(/^0*/,''));
                    var url = '/weeklyad/store/' + storeNumber + '/pages';

                    MobileService.request({
                        method: 'GET',
                        url: url
                    }).then(function (response) {
                        var r = response.data;
                        $scope.title = r.config.title;
                        $scope.pages = r.pages;
                        if (r.config.startDate || r.config.endDate) {
                            var now = new Date();
                            var startDate = r.config.startDate ? new Date(r.config.startDate) : now;
                            var endDate = r.config.endDate ? new Date(r.config.endDate) : now;

                            if (startDate <= endDate && now >= startDate && now <= endDate) {
                                $scope.pages = r.pages;
                            }
                        } else {
                            $scope.pages = r.pages;
                        }
                        CustomizeResolution($scope.pages);
                    }, function(){
                        $scope.pages = [{ "img": $scope.data.contentImageUrl }];
                    });
                }

                function cardtStoreChanged(event, data) {
                    if (data.selStore) {
                        $scope.store = data.selStore;
                        init();
                    }
                }

                $scope.$on('cardtStoreChanged', cardtStoreChanged);

                init();
            }
        };
    });
