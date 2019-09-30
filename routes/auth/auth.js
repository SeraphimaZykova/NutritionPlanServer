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

  router.get('/emailCheck', validateCheckBody('query'), async (req, res) => {
    try {
      let email = req.query.email;
      let result = await usersCollection.checkEmailToRegistration(email);
      
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
    try {
      let email = req.query.email;
      let password = req.query.password;
      
      let result = await usersCollection.login(email, password);
      if (result.error) {
        res.status(401).send(result);
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

  router.delete('/token', validateReqBody('query'), async(req, res) => {
    let email = req.query.email, password = req.query.password;
    let result = await usersCollection.invalidateToken(email, password);

    if (result.error) {
      res.status(401).send(result);
    }
    else {
      res.status(200).send(result);
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

  function validateCheckBody(target) {
    return (req, res, next) => {
      if (req[target].hasOwnProperty('email')) {
        next();
      } else {
        res.status(400).send('Error: 400 -> no credentials');
      }
    }
  }

  return router;
}