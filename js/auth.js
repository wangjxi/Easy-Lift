// REQUIRES jQuery!
(function ($) {
  var EXAMPLES_URL = 'https://b5-proj.firebaseio.com/';
  var TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjg2NTQwNjE1MDY0OCwidiI6MCwiZCI6eyJzYW5kYm94U2V0dXAiOnRydWV9LCJpYXQiOjE0MDYyMzcwNDh9.VTOxQD-EFpe_6tQXY2-I-kSMARw8hp7qOstrEu63cXM';

  // we preserve users' example keys to save on demo namespaces
  function getUniqueId() {
    var id;
    if (storage) {
      id = storage.getItem('example-key');
    }
    if (!id) {
      id = new Firebase(EXAMPLES_URL).push().name();
      if (storage) {
        storage.setItem('example-key', id);
      }
    }
    return id;
  }

  function getRandomDemoUrl(path) {
    var id = getUniqueId();
    return 'https://examples' + id + '.firebaseio-demo.com/' + path;
  }

  function copyDataIfEmpty(fromUrl, toUrl) {
    return checkIfEmpty(toUrl).then(function(isEmpty) {
      if( isEmpty ) {
        return resetData(fromUrl, toUrl);
      }
    });
  }

  function checkIfEmpty(toUrl) {
    return $.Deferred(function (def) {
      new Firebase(toUrl).once('value', function (snap) {
        def.resolve(snap.val() === null);
      }, def.reject);
    });
  }

  function resetData(fromUrl, toUrl) {
    var firebaseRef = new Firebase(toUrl);
    return $.Deferred(function(def) {
      function done(err) {
        if (err) {
          def.reject(err);
        } else {
          def.resolve();
        }
      }

      if( fromUrl ) {
        $.getJSON(fromUrl).then(function (data) {
          firebaseRef.set(data, done);
        }, done);
      }
      else {
        done('no fromUrl');
      }
    });
  }

  // create demo links for dashboard and resetting data
  function buildLinks(sourceUrl, destUrl) {
    var $target = $('[data-target="demo-links"]');
    if ($target.length) {
      $('<p></p>')
        .css('clear', 'both')
        .append(
        $('<a>view dashboard</a>')
          .prop('href', destUrl)
          .prop('target', '_blank')
      )
        .append(' | ')
        .append(
        $('<a href="#">reset data</a>').click(function (e) {
          e.preventDefault();
          resetData(sourceUrl, destUrl);
        })
      )
        .appendTo($target);
    }
  }

  function login(url) {
    return $.Deferred(function(def) {
      new Firebase(url).auth(TOKEN, function(err) {
        if( err ) { def.reject(err); }
        else {
          def.resolve(url);
        }
      });
    });
  }

  function deleteOnDisconnect(url) {
    new Firebase(url).onDisconnect().remove();
  }

  function logout(url) {
    new Firebase(url).unauth();
  }

  // determine if we can store the unique id in local storage
  var storage = (function () {
    var uid = new Date,
      storage,
      result;
    try {
      (storage = window.localStorage).setItem(uid, uid);
      result = storage.getItem(uid) == uid;
      storage.removeItem(uid);
      return result && storage;
    } catch (e) {}
  }());

  $.loadDemo = function (sourcePath, exampleName) {
    var destUrl = getRandomDemoUrl(exampleName);
    var sourceUrl = EXAMPLES_URL + sourcePath + '.json';

    buildLinks(sourceUrl, destUrl);

    return copyDataIfEmpty(sourceUrl, destUrl).then(function () {
      return $.Deferred().resolve(destUrl).promise();
    });
  };

  $.loadSandbox = function(path, sourcePath) {
    var id = getUniqueId();
    var toUrl = 'https://docs-sandbox.firebaseio.com/'+path+'/'+id;
    var sourceUrl = sourcePath? EXAMPLES_URL + sourcePath + '.json' : null;
    buildLinks(sourceUrl, toUrl);
    if( sourcePath ) {
      return login(toUrl)
          .then(deleteOnDisconnect)
          .then(function() {
            return copyDataIfEmpty(sourceUrl, toUrl);
          })
          .then(function() {
            return $.Deferred().resolve(toUrl).promise();
          })
          .always(logout);
    }
    else {
      return $.Deferred().resolve(toUrl).promise();
    }
  };

  $.getDemoUrl = getRandomDemoUrl;

})(jQuery);