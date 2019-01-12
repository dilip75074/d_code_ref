(function(window, document) {
  //SOASTA
  window.SOASTA = window.SOASTA || {};
  window.SOASTA.pg = '';
  //BOOMR
  window.BOOMR_lstart = null;
  window.BOOMR_config = {
    autorun: true,
    Angular: {
      enabled: true
    }
  };

  var BOOM = function(e) {

    var SOASTA_KEY = ((e && e.detail || {}).soasta || {})[window.stpls_env];

    if (!SOASTA_KEY || (window.BOOMR && window.BOOMR.version)) { return; }
    var dom,doc,where,iframe = document.createElement('iframe');
    iframe.src = 'javascript:false';
    (iframe.frameElement || iframe).style.cssText =
      'width: 0; height: 0; border: 0; display: none;';
    where = document.getElementsByTagName('script')[0];
    where.parentNode.insertBefore(iframe, where);

    try {
      doc = iframe.contentWindow.document;
    } catch(e) {
      dom = document.domain;
      iframe.src='javascript:var d=document.open();d.domain=\''+dom+'\';void(0);';
      doc = iframe.contentWindow.document;
    }
    doc.open()._l = function() {
      var js = this.createElement('script');
      if (dom) { this.domain = dom; }
      js.id = 'boomr-if-as';
      js.src = '//c.go-mpulse.net/boomerang/'+SOASTA_KEY;
      window.BOOMR_lstart=new Date().getTime();
      this.body.appendChild(js);
    };
    doc.write('<body onLoad="document._l();">');
    doc.close();
    return true;
  };

  BOOM({detail: window.stpls_locale}) || document.addEventListener('stplsLocale', BOOM);

})(window, document);
