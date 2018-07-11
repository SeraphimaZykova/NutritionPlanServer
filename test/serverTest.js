const www = require('./../bin/www')
  , assert = require('assert')
  , http = require('http')
  ;

const host = 'localhost'
  , port = 3001
  , httpRequest = 'http://' + host + ':' + port
  ;

describe('server', function () {
  before(function () {
    www.start();
  });

  after(function () {
    www.stop();
  });

  describe('/test', function () {
    it('should return 200', function (done) {
      http.get(httpRequest + '/test', function (res) {
        assert.equal(200, res.statusCode);
        done();
      });
    });
  
    it('should say "Hello, world!"', function (done) {
      http.get(httpRequest + '/test', function (res) {
        var data = '';
  
        res.on('data', function (chunk) {
          data += chunk;
        });
  
        res.on('end', function () {
          assert.equal('Hello, world!\n', data);
          done();
        });
      });
    });
  });

  describe('/search', function() {
    it('fail', function(done) {
      http.get(httpRequest + '/search', function (res) {
        assert.equal(200, res.statusCode);
        done();
      })
    });

    it('fail', function(done) {
      http.get(httpRequest + '/search', function (res) {
        var data = '';
  
        res.on('data', function (chunk) {
          data += chunk;
        });
  
        res.on('end', function () {
          assert.equal([
            { name: 'some' }, 
            { name: 'predefined' }, 
            { name: 'results'} 
          ], data);
          done();
        });
      })
    });
  });
});