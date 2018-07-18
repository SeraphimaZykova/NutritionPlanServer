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
    it('invalid request, return error code 400', function(done) {
      http.get(httpRequest + '/search', function (res) {
        assert.equal(400, res.statusCode);
        done();
      })
    });

    it('invalid request, return error message', function(done) {
      http.get(httpRequest + '/search', function (res) {
        var data = '';
  
        res.on('data', function (chunk) {
          data += chunk;
        });
  
        res.on('end', function () {
          assert.equal('Error: 400 -> no search args', data);
          done();
        });
      })
    });

    it('valid request, ec = 200', function(done) {
      http.get(httpRequest + '/search?args=avocado', function (res) {
        assert.equal(200, res.statusCode);
        done();
      })
    });

    it('valid request, shold contain avocado', function(done) {
      http.get(httpRequest + '/search?args=avocado', function (res) {
        var data = '';
  
        res.on('data', function (chunk) {
          data += chunk;
        });
  
        res.on('end', function () {
          let dataObject = JSON.parse(data);
          assert.equal(dataObject.length > 0, true);
          done();
        });
      })
    });
  });

  describe('/searchAPI', function() {
    it('invalid request, return error code 400', function(done) {
      http.get(httpRequest + '/searchAPI', function (res) {
        assert.equal(400, res.statusCode);
        done();
      })
    });

    it('invalid request, return error message', function(done) {
      http.get(httpRequest + '/searchAPI', function (res) {
        var data = '';
  
        res.on('data', function (chunk) {
          data += chunk;
        });
  
        res.on('end', function () {
          assert.equal('Error: 400 -> no search args', data);
          done();
        });
      })
    });

    it('valid request, ec = 200', function(done) {
      this.timeout(10000);
      http.get(httpRequest + '/searchAPI?args=avocado', function (res) {
        assert.equal(200, res.statusCode);
        done();
      })
    });

    it('valid request, shold contain avocado', function(done) {
      this.timeout(30000);
      http.get(httpRequest + '/searchAPI?args=avocado', function (res) {
        var data = '';
  
        res.on('data', function (chunk) {
          data += chunk;
        });
  
        res.on('end', function () {
          let dataObject = JSON.parse(data);
          console.log(dataObject);
          assert.equal(dataObject.length > 0, true);
          done();
        });
      })
    });
  })
});