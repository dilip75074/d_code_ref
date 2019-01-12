'use strict';

angular.module('stplsConveyor')
    .directive('conveyorSearch', function(WidgetFactory) {
        return WidgetFactory.directive({
            template: '<div class="conveyor-search-container">' +
                //'<header-search overlay="true"></header-search>' +
                '</div>'
        });
    });
