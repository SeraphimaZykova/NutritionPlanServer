const 
  https = require('https')
  , queryString = require('querystring')
  , appId = "1a00fe85"
  , appKey = '41b4d94379febc9ba23d79820d03d4a7'
  ;

let body = {
  'appId': appId,
  'appKey': appKey,
  'query': 'Apple'
}

async function makePost(str) {
  body.query = str;

  return await new Promise((rslv, rjct) => {
      let answer = '';

      let query = https.request({
        hostname: 'api.nutritionix.com',
        port: 443,
        path: '/v1_1/search',
        method: 'POST',
        headers: {
          'Content-Type':'application/JSON'
        }

      }, res => {
        res.on('data', chunk => {
          answer += chunk;
        });

        res.on('end', () => {
          rslv(answer);
        })
      });   

    query.on('error', err => {
      console.log(err);
    });
    
    try {
      query.write (JSON.stringify(body));
      query.end();
    } catch (error) {
      console.log(error);
    }
    
  });
}

module.exports.requestData = makePost;