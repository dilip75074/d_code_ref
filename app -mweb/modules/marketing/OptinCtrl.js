'use strict';

angular.module('stpls')
    .controller('OptinCtrl', function($scope, $element, $rootScope, $state, $timeout, $translate, $filter, $q, scroll, Account, Profile, MobileService, Config) {

            var opts = $scope.options = angular.extend({
                subheader: false,
                header: 'OPT_HDR'
            }, $scope.$eval($scope.options || '{}'));

            // utilize pixels until MobileService exists
            var pixels = {
                email: {
                    format: 'http://easy.staples.com/pub/rf?_ri_=X0Gzc2X%3DWQpglLjHJlYQGuyrumrU5HpbKijzfazgIzbDYzfGuv8i4zanVwjpnpgHlpgneHmgJoXX0Gzc2X%3DWQpglLjHJlYQGijcEd2v7Pjrjl1cGACjb2lGuv8i4zan&EMAIL_PERMISSION_STATUS_=I&OPTSTATUS_PROMO=Y',
                    param: 'email_address_',
                    params: {
                        OPTSTATUS_PROMO_DT: $filter('date')(new Date(), 'yyyy-MM-dd'),
                        EMAIL_PREF_CH_DT: $filter('date')(new Date(), 'yyyy-MM-dd'),
                        POSTAL_CODE_: Account.getZipCode(),
                        SOURCE_CODE: $state.params.code || 'MTH' //tophat is default
                    }
                }
            };

            // pre-populate from profile
            // TODO: promise
            var preference = Profile.getOptIns();
            var visitor = Profile.getVisitor();
            $scope.optin = {
                email: preference.email || visitor.email || '',
                sms: preference.sms || visitor.phone || ''
            };

            $scope.yes = {
                email: true,
                sms: true
            };

            var inputKeys = Object.keys($scope.optin);

            //onload method from order confirmation
            $scope.initOrder = function(data) {
                opts.header = false;

                $scope.optin.email = data.eMailAddr || '';
                $scope.optin.sms = (data.billing || {}).phone || data.shippingPhone || '';
                pixels.email.params.SOURCE_CODE = 'MOC';
            };

            //toggle from footer
            var headerText;
            $scope.toggle = function() {
                if (opts.footer) {
                    headerText = headerText || opts.header;
                    var exp = $scope.options.expanded = !$scope.options.expanded;

                    opts.header = exp ? 'OPT_SIGNUP_BELOW' : headerText;
                    pixels.email.params.SOURCE_CODE = 'MOF';
                    if (exp) {
                      scroll.to('opt-toggle-scroll');
                    }
                }
            };

            $scope.toggleInput = function($input) {
                var key = $input.$name;
                var a = $scope.yes[key] = !$scope.yes[key];
                if (!a) {
                    $scope.reset($input);
                } else {
                    $timeout(function() {
                        $element.parent()[0].querySelector('input[name="' + key + '"]').focus();
                    });
                }
            };

            var processOptin = function($input) {
                var d = $q.defer();
                var key = $input.$name;

                if (key === 'sms') {
                    var config = Config.getProperty('codeBroker') || {};
                    MobileService.request({
                        method: 'GET',
                        url: config.path,
                        params: {
                            cbid: config.id,
                            key: config.key,
                            program: config.name,
                            msc: config.shortcode,
                            upref: config.upref,
                            uprefhod: config.uprefhod,
                            spn: '1' + $input.$modelValue,
                            uprefustz: (new Date().toString().match(/\((\w+)\)$/) || ['EST']).pop().replace(/DT$/,'ST')
                        }
                    }).then(function(response) {
                        d.resolve(response);
                    }, function(error) {
                        d.reject(error);
                    });
                } else {
                    var config = pixels[key];

                    //set dynamic param
                    var params = config.params;
                    params[config.param] = (key === 'sms' ? '1' : '') + $input.$modelValue;

                    // drop pixel
                    var $pixel = angular.element('<img/>').attr({
                        src: config.format + '&' + Object.keys(params).map(function(k) {
                            return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
                        }).join('&')
                    }).css({
                        height: 1,
                        width: 1,
                        visibility: 'hidden'
                    })
                        .on('load error', d.resolve);

                    $element.parent().append($pixel);
                }

                return d.promise;
            };

            $scope.isOpted = function($input) {
                var key = $input.$name;
                var pref = preference[key];
                if(pref && !$input.$editOpt){
                  $scope.optin[key] = pref;
                  $input.$opted = true;
                }
                return $input.$opted;
            };

            $scope.editOpt = function($input) {
              $input.$opted = false;
              $input.$editOpt = true;
            };

            $scope.reset = function($input) {
              $scope.optin[$input.$name] = '';
              $input.$opted = false;
              $input.$setPristine();
              $input.$render();
            };

            $scope.ready = function($form) {
              return ($form.$dirty || $form.$pristine) && inputKeys.filter(function(k) {
                //return complete inputs
                var $opt = $form[k];
                return !$opt.$opted && $opt.$valid;
              }).length;
            };

            $scope.done = function($form) {
              return $form.$submitted && !inputKeys.filter(function(k) {
                //return incomplete inputs
                var $opt = $form[k];
                return ($opt.$dirty && !$opt.$opted);
              }).length;
            };

            $scope.updateOptIns = function($form) {
                var yes = $scope.yes;
                var optins = [];

                angular.forEach(inputKeys, function(k) {
                    var $input = $form[k];
                    if ($input.$valid && $input.$modelValue && yes[k]) {
                        optins.push($input);
                    }
                });

                optins.filter(function($input) {
                    return !$input.$opted;
                }).forEach(function($opt) {
                  var key = $opt.$name;
                  $scope.loading = true;
                  processOptin($opt).then(function() {
                    $opt.$opted = true;
                    preference[key] = $opt.$modelValue;
                    Profile.setOptIns(preference);
                    $form.$setSubmitted();
                  })['finally'](function() {
                    $scope.loading = false;
                  });
                });

            };

            $scope.goShop = function() {
              $scope.toggle();
              $state.go('home');
            };

        }
    );
