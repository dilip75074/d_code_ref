'use strict';


/**
 * @ngdoc function
 * @name stpls.model:Device
 */
angular.module('stpls').factory('Device', function($q, $translate, $window) {

	var isNativeCache = null;

	var isNative = function(){

		// if already set for session
		if(isNativeCache != null){
			return isNativeCache;
		}


		try {

			var nativeLocal = localStorage.getItem('stpls.isNative');

		}
		catch(e){

			var nativeLocal = null;

		}

		// if localStorage is set
		if(nativeLocal != null && window.location.href.indexOf('skwebappnew=1') < 0){

			isNativeCache = (nativeLocal == 'true');

			return isNativeCache;

		}
		// Check for hash param
		else {

			// if native hash param set
			if(window.location.href.indexOf('skwebappnew=1') > 0){

				isNativeCache = true;
			}
			else {
				isNativeCache = false;
			}


			try {

				localStorage.setItem('stpls.isNative', isNativeCache);

			}
			catch(e){}


			return isNativeCache;

		}


	};


	var getSize = function(){

		var w = window.innerWidth;

		var s = null;

		if(w < 768){
			s = 'xs';
		}
		else if(w >= 768 && w < 992){
			s = 'sm';
		}
		else if(w >= 992 && w < 1200){
			s = 'md';
		}
		else if(w >= 1200){
			s = 'lg';
		}

		return s;


	};

	var formFactorOverride = false;
	var getFormFactor = function(){

		if(formFactorOverride){
			return formFactorOverride;
		}
		else if(device.mobile()){

			return 'mobile';
		}
		else if(device.tablet()){
			return 'tablet';
		}
		else {
			return 'tablet';
		}


	};

	var overrideFormFactor = function(formFactor){

		formFactorOverride = formFactor;

	};

	var getDisplayType = function(){

		// High Density
		if(window.devicePixelRatio > 1 || (window.matchMedia && window.matchMedia("(-webkit-min-device-pixel-ratio: 1.5),(-moz-min-device-pixel-ratio: 1.5),(min-device-pixel-ratio: 1.5)").matches)){

			return 'HD';

		}
		else {
			return 'standard';
		}


	};

	return {

		isNative: isNative,

		getSize: getSize,

		getDisplayType: getDisplayType,

		getFormFactor: getFormFactor,
		overrideFormFactor: overrideFormFactor,
		is: $window.device //defined below

	};

});

/*! device.js 0.1.61 */
(function(){var a,b,c,d,e,f,g,h,i,j;a=window.device,window.device={},c=window.document.documentElement,j=window.navigator.userAgent.toLowerCase(),device.ios=function(){return device.iphone()||device.ipod()||device.ipad()},device.iphone=function(){return d("iphone")},device.ipod=function(){return d("ipod")},device.ipad=function(){return d("ipad")},device.android=function(){return d("android")},device.androidPhone=function(){return device.android()&&d("mobile")},device.androidTablet=function(){return device.android()&&!d("mobile")},device.blackberry=function(){return d("blackberry")||d("bb10")||d("rim")},device.blackberryPhone=function(){return device.blackberry()&&!d("tablet")},device.blackberryTablet=function(){return device.blackberry()&&d("tablet")},device.windows=function(){return d("windows")},device.windowsPhone=function(){return device.windows()&&d("phone")},device.windowsTablet=function(){return device.windows()&&d("touch")&&!device.windowsPhone()},device.fxos=function(){return(d("(mobile;")||d("(tablet;"))&&d("; rv:")},device.fxosPhone=function(){return device.fxos()&&d("mobile")},device.fxosTablet=function(){return device.fxos()&&d("tablet")},device.meego=function(){return d("meego")},device.cordova=function(){return window.cordova&&"file:"===location.protocol},device.nodeWebkit=function(){return"object"==typeof window.process},device.mobile=function(){return device.androidPhone()||device.iphone()||device.ipod()||device.windowsPhone()||device.blackberryPhone()||device.fxosPhone()||device.meego()},device.tablet=function(){return device.ipad()||device.androidTablet()||device.blackberryTablet()||device.windowsTablet()||device.fxosTablet()},device.desktop=function(){return!device.tablet()&&!device.mobile()},device.portrait=function(){return window.innerHeight/window.innerWidth>1},device.landscape=function(){return window.innerHeight/window.innerWidth<1},device.noConflict=function(){return window.device=a,this},d=function(a){return-1!==j.indexOf(a)},f=function(a){var b;return b=new RegExp(a,"i"),c.className.match(b)},b=function(a){return f(a)?void 0:c.className+=" "+a},h=function(a){return f(a)?c.className=c.className.replace(a,""):void 0},device.ios()?device.ipad()?b("ios ipad tablet"):device.iphone()?b("ios iphone mobile"):device.ipod()&&b("ios ipod mobile"):b(device.android()?device.androidTablet()?"android tablet":"android mobile":device.blackberry()?device.blackberryTablet()?"blackberry tablet":"blackberry mobile":device.windows()?device.windowsTablet()?"windows tablet":device.windowsPhone()?"windows mobile":"desktop":device.fxos()?device.fxosTablet()?"fxos tablet":"fxos mobile":device.meego()?"meego mobile":device.nodeWebkit()?"node-webkit":"desktop"),device.cordova()&&b("cordova"),e=function(){return device.landscape()?(h("portrait"),b("landscape")):(h("landscape"),b("portrait"))},i="onorientationchange"in window,g=i?"orientationchange":"resize",window.addEventListener?window.addEventListener(g,e,!1):window.attachEvent?window.attachEvent(g,e):window[g]=e,e()}).call(this);
var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
