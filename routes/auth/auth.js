module.exports = function (router) {
  const usersCollection = require('../../database/user');

  router.post('/register', validateReqBody, async (req, res) => {
    try {
      let email = req.body.email;
      let password = req.body.password;
      console.log(email, password)

      let result = await usersCollection.register(email, password);
      console.log(result)
      if (result.error) {
        res.status(400).send(result);
      }
      else {
        res.status(200).send(result);
      }
    }
    catch(err) {
      console.log(`Error: ${err.message}`)
      res.send({
        status: false, 
        error: err.message
      });
    }
  });

  router.get('/login', validateReqBody, async (req, res) => {
    console.log('LOGIN');
    try {
      let email = req.body.email;
      let password = req.body.password;
      
      let result = await usersCollection.login(email, password);
      console.log(result);

      if (result.error) {
        res.status(400).send(result);
      }
      else {
        res.status(200).send(result);
      }
    }
    catch(err) {
      console.log(`Error: ${err.message}`)
      console.log(err);
      res.send({
        status: false
        , data: err.message
      });
    }
  });

  function validateReqBody(req, res, next) {
    if (req.body.hasOwnProperty('email') && req.body.hasOwnProperty('password')) {
      next();
    } else {
      res.status(400).send('Error: 400 -> no credentials');
    }
  }

  return router;
}