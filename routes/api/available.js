module.exports = function (router) {
  const pantryCollection = require('../../database/pantry');
  const userCollection = require('../../database/user');


  router.get('/', validateAvailable, async (req, res) => {
    try {
      let token = req.query.token
        , userEmail = req.query.email;

      let result = await pantryCollection.get(userEmail, token);
      console.log(result);

      res.status(200).send(result);
    }
    catch(err) {
      console.log(`Error: ${err.message}`)
      res.send({
        status: false
        , data: err.message
      });
    }
  });


  router.post('/add', async (req, res) => {
    res.status(404).send();
  });

  function validateAvailable(req, res, next) {
    if (req.query.hasOwnProperty('token') && req.query.hasOwnProperty('email')) {
      next();
    } else {
      res.status(400).send({
        error: "invalid request"
      });
    }
  }

  return router;
}