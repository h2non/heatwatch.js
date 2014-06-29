(function (global, document, location) {
  'use strict';

  var store = {
    key: [],
    click: [],
    mouse: []
  }

  var config = {
    server: 'http://localhost:3000',
    mouse: true,
    click: true,
    api: '0e0edde8-ff7e-11e3-80d5-b2227cce2b54'
  }

  function now() {
    return new Date().getTime()
  }

  function flushStore() {
    store = {
      key: [],
      click: [],
      mouse: []
    }
  }

  function extend(target, obj) {
    if (typeof obj === 'object' && obj !== null) {
      for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
          target[p] = obj[p]
        }
      }
    }
    return target
  }

  function throttle(fn, ms) {
    var time = now()
    return function () {
      if ((now() - time) > ms) {
        time = now()
        fn.apply(null, arguments)
      }
    }
  }

  var send = (function () {
    var timeout = 5000
    var url = config.server + '/track'

    function createClient(url) {
      var xhr = new XMLHttpRequest()
      var method = 'POST'
      if ('withCredentials' in xhr) {
        xhr.open(method, url, true)
      } else if (typeof XDomainRequest !== undefined) {
        // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
        xhr = new XDomainRequest()
        xhr.open(method, url)
      } else {
        return null
      }
      xhr.timeout = timeout
      xhr.setRequestHeader('X-API-Token', config.api)
      xhr.setRequestHeader('X-API-Version', '0.1')
      return xhr
    }

    function onError(cb) {
      var called = false
      return function (err) {
        if (!called) {
          cb(err || 'error')
          called = true
        }
      }
    }

    function onLoad(xhr, cb) {
      return function () {
        if (xhr.readyState === 4) {
          if(xhr.status >= 200 && xhr.status <= 300) {
            cb(null, xhr.responseText)
          } else {
            cb('Request error: ' + xhr.status)
          }
        }
      }
    }

    return function request(data, cb) {
      var errorHandler
      var xhr = createClient(url)
      cb = cb || function () {}
      if (!xhr) { return }

      errorHandler = onError(cb)
      xhr.onerror = errorHandler
      xhr.ontimeout = errorHandler
      xhr.onload = onLoad(xhr, cb)
      xhr.send(JSON.stringify(data))
    }
  }())

  function trackData() {
    if (store.mouse.length > 100 || store.click.length > 3) {
      send({
        host: location.hostname,
        resolution: {
          height: global.outerHeight,
          width: global.outerWidth
        },
        data: store
      })
      flushStore()
    }
  }

  /**
   * Event trackers
   */
  function trackKeyEvent(ev) {
    var data = {
      time: now(),
      key: ev.key || ev.charCode,
      ctrlKey: ev.ctrlKey,
      place: ev.location,
      path: location.pathname
    }
    store.key.push(data)
  }

  function trackClickEvent(ev) {
    var data = {
      time: now(),
      x: ev.x || ev.clientX,
      y: ev.y || ev.clientY,
      path: location.pathname
    }
    if (ev.toElement) {
      data.text = ev.toElement.textContent || ev.toElement.outerText
    }
    store.click.push(data)
  }

  function trackMouseMove(ev) {
    var data = {
      time: now(),
      x: ev.x || ev.clientX,
      y: ev.y || ev.clientY,
      path: location.pathname
    }
    store.mouse.push(data)
    trackData()
  }

  function init() {
    var body = document.body
    global.onkeypress = throttle(trackKeyEvent, 2000)
    body.onclick = throttle(trackClickEvent, 500)
    body.onmousemove = throttle(trackMouseMove, 250)
  }

  function setConfig(obj) {
    extend(config, obj)
  }

  document.onreadystatechange = function () {
    if (document.readyState === 'complete') {
      init()
    }
  }

  global.heatwatch = {
    config: setConfig
  }

}(window, document, location))
