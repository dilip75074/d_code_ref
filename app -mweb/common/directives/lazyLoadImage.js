'use strict';


angular.module('stplsTemplates')
    .service('lazyLoadImageListener', function($window, $document, $timeout) {
        var id = 0,
            listeners = {},
            queue = {};

        var last = 0;
        function invokeListeners() {
            var clientHeight = $document[0].documentElement.clientHeight,
                clientWidth = $document[0].documentElement.clientWidth;

            for (var key in listeners) {
                if (listeners.hasOwnProperty(key)) {
                    listeners[key](clientHeight, clientWidth); // call listener with given arguments
                }
            }
            last = new Date().getTime();
        }
        var deferEvent = function(e){
          var wait = 20;
          var now = new Date().getTime();
          // console.log(e.type, now - last);
          if(now - last < wait) {
            $timeout.cancel(queue[e.type]);
          }
          queue[e.type] = $timeout(invokeListeners, wait);
        };

        $document.on('lazyscroll touchmove scroll resize', deferEvent);


        return {
            bindListener: function(listener) {
                var index = ++id;

                listeners[id] = listener;

                return function() {
                    delete listeners[index];
                };
            }
        };
    }
).directive('lazyLoadImage', function ($document, lazyLoadImageListener) {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attributes) {
                var listenerRemover;

                var original = $element[0].className;
                var hideClass = 'hide_image',
                    animated = 'animated',
                    showClass = ~original.indexOf('fade') ? original : 'fadeIn';

                $element.addClass(hideClass).removeClass(showClass);

                function isInView(clientHeight, clientWidth) {
                    // get element position
                    var imageRect = $element[0].getBoundingClientRect();

                    if (
                        $attributes.lazySrc &&
                        (imageRect.top >= -imageRect.height && imageRect.bottom - imageRect.height <= clientHeight) &&
                        (imageRect.left >= -imageRect.width && imageRect.right - imageRect.width <= clientWidth)
                    ) {
                        $element.on('load', function() {
                            $element.removeClass([showClass, hideClass, animated].join(' '))
                                  .addClass(animated + ' ' + showClass);
                        });

                        $element[0].src = $attributes.lazySrc; // set src attribute on element (it will load image)

                        // unbind event listeners when image src has been set
                        (listenerRemover || angular.noop)();
                        listenerRemover = null;
                    }
                }

                //handle reusable scope
                $scope.attributes = $attributes;
                $scope.$watch('attributes.lazySrc',function(src, old) {
                  if (src !== old) {
                    $element.removeClass([showClass, animated].join(' '))
                        .addClass(hideClass);
                  }
                  // bind listener
                  if (!listenerRemover) {
                    listenerRemover = lazyLoadImageListener.bindListener(isInView);
                    // explicitly call scroll listener (because, some images are in viewport already and we haven't scrolled yet)
                    isInView(
                        $document[0].documentElement.clientHeight,
                        $document[0].documentElement.clientWidth
                    );
                  }
                });

                // unbind event listeners if element was destroyed
                // it happens when you change view, etc
                $element.on('$destroy', function () {
                    (listenerRemover || angular.noop)();
                });
            }
        };
    }
).directive('lazyScroller',function($document){
  return {
    restrict: 'A',
    link: function($scope, $element) {
      $element.on('scroll touchmove',function(){
        $document.triggerHandler('lazyscroll');
      });
    }
  };
});
