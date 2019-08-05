module.exports = function (router) {
  const user = require('../../database/user');

  router.get('/', validateReqQuery, async (req, res) => {
    try {
      let email = req.query.email
        , token = req.query.token;

      let result = await user.get(email, token, {'userData': 1, '_id': 0});
      console.log('settings request: ', result)
      res.status(200).send(result.userData);
    }
    catch(err) {
      console.log(`Error: ${err.message}`)
      res.send({
        status: false
        , data: err.message
      });
    }
  });

  router.post('/userData', validatePost, async (req, res) => {
    try {
      let email = req.body.email
        , token = req.body.token
        , userData = req.body.userData;

      let result = await user.update(email, token, 'userData', userData);
      if (result.result.ok == 1) {
        res.status(200).send({});
      } else {
        res.status(500).send({error: 'database error'})
      }
    } catch (err) {
      console.log(`Error: ${err.message}`)
      res.send({
        status: false
        , error: err.message
      });
    }
  });

  function validateReqQuery(req, res, next) {
    if (req.query.hasOwnProperty('email') && req.query.hasOwnProperty('token')) {
      next();
    } else {
      res.status(400).send({
        error: 'invalid request: search args missing'
      });
    }
  }

  function validatePost(req, res, next) {
    if (req.body.hasOwnProperty('userData') && req.body.hasOwnProperty('email') && req.body.hasOwnProperty('token')) {
      next();
    } else {
      res.status(400).send({
        error: 'invalid request: data missing'
      });
    }
  }

  return router;
}