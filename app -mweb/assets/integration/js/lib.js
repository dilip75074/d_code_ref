!function() {
    var mobileHost = "https://m.staples.com";
    var urlCart = mobileHost + "/chapi/cart?";
    var urlGuest = mobileHost + "/guestLogin";
    var isGuest = false;

    function zipcode() {
        return getCookie("zipcode") || "01702";
    }

    function getCookie(cname) {
        var name = cname + '=';
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var c = cookies[i].trim();
            if (c.indexOf(name) == 0)
                return c.substring(name.length, c.length);
        }
        return '';
    }

    function defaultSetting() {
        return 'locale=en_US&zip=' + zipcode();
    }

    function getError(err) {
        var errorMessage = '';
        var errorCode = '';
        err = err || {};
        if (err.responseMessage && "string" == typeof err.responseMessage) {
            errorMessage = err.responseMessage;
            errorCode = err.responseCode;
        } else if (err.responseMessage && "object" == typeof err.responseMessage && err.responseMessage.errormessage) {
            errorMessage = err.responseMessage.errormessage;
            errorCode = err.responseMessage.errorcode;
        } else if (err.properties && err.properties.state && err.properties.state.errormessage) {
            errorMessage = err.properties.state.errormessage;
            errorCode = err.properties.state.errorcode
        }

        return {
            errorMessage: errorMessage,
            errorCode: errorCode
        };
    }

    function missingSession(response) {
        var error = getError(response);
        var errorMessage = (error.errorMessage || "").toLowerCase();
        var errorCode = error.errorCode;
        return errorCode == "401" ||
        (/required parameter \'authtoken\' missing/i.test(errorMessage)) ||
        (/Unauthorised user/i.test(errorMessage)) ||
        (/invalid cookie/i.test(errorMessage)) ||
        (/activity token/i.test(errorMessage)) ||
        (/wctrusted/i.test(errorMessage)) ||
        (/duplicatekeyexception/i.test(errorMessage));
    }

    function guestLogin(retry) {
        var option = {
            type: "POST",
            url: urlGuest,
            contentType: 'application/x-www-form-urlencoded',
            xhrFields: {withCredentials:  true}
        };

        option.success = option.error = function(data) {
            if (retry) {
                retry (data);
            }
        };

        $.ajax(option);
    }

    function initSession(response, retryOptions) {
        var retry = function(response) {
            if (response && response.responseCode == "0") {
                request(retryOptions);
            } else {
                alert("Error while adding the product to cart... Try again later..");
            }
        };

        if (isGuest) {
            guestLogin(retry);
        }
        else {
            alert("Your m.staples.com login has been expired");
        }
    }

    function request(options, canRetry) {
        var retryOptions = options;
        var successCallback = options.success;

        options.success = function(response) {
            var result = response;
            var itemAdded;
            if (response.message === undefined && !response.errors) {
                itemAdded = (response.itemsAdded || [])[0];
                if (itemAdded) {
                    result = {
                        responseCode: '0',
                        properties: {
                            cartinfo: {
                                message: itemAdded.message,
                                orderItemId: (itemAdded.orderItemIds || [])[0].orderItemId
                            }
                        }
                    };
                }
            }

            if (successCallback) {
                successCallback(result);
            }
        };

        var errorCallback = options.error;
        if (errorCallback) {
            options.error = function(err) {
                if (!errorCallback) {
                    return;
                }
                var r = err.responseJSON || err;
                var errMsg = r.errorMessage;
                if (!errMsg && r.originalError && r.originalError.data) {
                    errMsg = r.originalError.data.error;
                }
                var result = {
                    responseCode: '1',
                    properties: {
                        state: {errormessage: errMsg}
                    },
                    responseMessage: errMsg
                };
                if (canRetry && missingSession(result)) {
                    canRetry = false;
                    options.success = successCallback;
                    options.error = errorCallback;
                    initSession(result, options);
                } else if (errorCallback) {
                    errorCallback(result);
                }
            };
        }

        $.ajax(options);
    }

    function addToCart(sku, qty, storeNumber) {
        var data = JSON.stringify({'data': [{
            sku: sku,
            qty: qty,
            deliveryMode: storeNumber ? 'ISP' : 'STA',
            storeNumber: storeNumber
        }]});

        var option = {
            type: "POST",
            url: urlCart + defaultSetting(),
            contentType: 'application/json',
            data: data,
            xhrFields: {withCredentials: true},
        };
        option.success = option.error = function(data) {
            showResponse(data);
        };

        request(option, true);
    }

    function getCartCount() {
        var tag = '&skuCoupon=Y&_t=' + Math.floor(Math.random() * 1e10) + Date.now();
        var option = {
            type: "GET",
            url: urlCart + defaultSetting() + tag,
            dataType: 'json',
            xhrFields: {withCredentials:  true},
            success: function(response) {
                showResponse(response.itemCount);
            }
        };

        request(option);
    }

    function extractDomain(url) {
        var domain;
        // Find & remove protocol (http, ftp, etc.) and get domain
        if (url.indexOf("://") > -1) {
            domain = url.split('/')[2];
        }
        else {
            domain = url.split('/')[0];
        }

        //find & remove port number
        domain = domain.split(':')[0];

        return domain;
    }

    function loginHelper() {
        window.addEventListener("message", function(event) {
            var origin = extractDomain(event.origin || event.originalEvent.origin || "");
            var originMweb = extractDomain(mobileHost);
            if (origin === originMweb) {
                isGuest = !event.data.isLoggedIn;
                if (!event.data.isUserIdentified) {
                    guestLogin();
                }
            }
        }, true);
        $("body").append("<iframe src='" + mobileHost + "/assets/integration/html/iframe/login.html' style='width:1px;height:1p;display:none;padding:0p;margin:0px;'></iframe>")
    }

    function lib() {
        this.doAddToCart = addToCart;
        this.getCartCount = getCartCount;
        loginHelper();
        return this;
    }

    $(document).ready(function() {
        window._mweblib = new lib;
    })
}();

