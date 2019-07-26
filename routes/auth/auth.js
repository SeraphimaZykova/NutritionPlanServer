module.exports = function (router) {
  const usersCollection = require('../../database/user');

  router.post('/register', validateReqBody('body'), async (req, res) => {
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

  router.get('/login', validateReqBody('query'), async (req, res) => {
    console.log('LOGIN');
    try {
      let email = req.query.email;
      let password = req.query.password;
      
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

  function validateReqBody(target) {
    return (req, res, next) => {
      if (req[target].hasOwnProperty('email') && req[target].hasOwnProperty('password')) {
        next();
      } else {
        res.status(400).send('Error: 400 -> no credentials');
      }
    }
    
  }


  return router;
}