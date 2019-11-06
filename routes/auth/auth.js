module.exports = function (router) {
  const usersCollection = require('../../database/user')
  , availableCollection = require('../../database/available')
  , rationCollection = require('../../database/ration')
  , codeGenerator = require("../../helpers/confirmation_code_generator")
  ;

  router.post('/register', validateReqBody('body'), async (req, res) => {
    try {
      let email = req.body.email;
      let password = req.body.password;
      console.log('register', email, password)

      let result = await usersCollection.register(email, password);

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

  router.post('/resetPassword/init', validateCheckBody('body'), async (req, res) => {
    try {
      const email = req.body.email;
      let result = await usersCollection.get( { 'credentials.email': email }, { '_id': 1 });
      console.log(result)

      if (result) { 
        let code = codeGenerator();
        let updRes = await usersCollection.updateById(result._id, { 'credentials.code': code }, [] );
        if (updRes) {
          //todo: send email with code
          console.error('send email with code');
        } else {
          res.status(503).send({ error: "Unreachable database"})
          return 
        }
      } else {
        //todo: send mail "ignore me"
        console.error('send email with ignore-me text')
      }

      res.status(200).send({})
    } catch (err) {
      res.status(401).send({
        error: err.message
      });
    }
  });

  router.post('/resetPassword/code', validateCheckBody('body'), async (req, res) => {
    try {
      const email = req.body.email,
        code = req.body.code;

      let result = await usersCollection.get( { 'credentials.email': email, 'credentials.code': code }, { '_id': 1 });

      if (result) {
        res.status(200).send({})
      } else {
        res.status(500).send({ error: "Wrong code" })
      }
    } catch (err) {
      res.status(401).send({
        error: err.message
      });
    }
  });

  router.post('/resetPassword', validateCheckBody('body'), async (req, res) => {
    try {
      const email = req.body.email,
        code = req.body.code,
        password = req.body.password;

      let result = await usersCollection.get( { 'credentials.email': email, 'credentials.code': code }, { '_id': 1 });

      if (result) {
        let updRes = await usersCollection.updateById(result._id, { 'credentials.password': password }, [ 'credentials.code', 'credentials.token' ]);
        if (updRes) {
          res.status(200).send({});
          return;
        }
      } 
      
      res.status(500).send({})

    } catch (err) {
      res.status(401).send({
        error: err.message
      });
    }
  });

  router.get('/emailCheck', validateCheckBody('query'), async (req, res) => {
    try {
      let email = req.query.email;
      let isSaved = await usersCollection.isEmailSaved(email);
      
      if (isSaved) {
        res.status(400).send({
          error: "this email was already registered"
        });
      }
      else {
        res.status(200).send({});
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
        let localeGMTms = result.localeGMTSeconds * 1000;
        let now = new Date(Date.now() + localeGMTms);
        let loginTime = result.loginTime;
        let localLoginTime = new Date(loginTime.getTime() + localeGMTms);
      
        console.log(now)
        console.log(loginTime)
        console.log(localLoginTime)
      
        if (now.getUTCFullYear() != localLoginTime.getUTCFullYear() || 
            now.getUTCMonth() != localLoginTime.getUTCMonth() ||
            now.getUTCDate() != localLoginTime.getUTCDate()) {
              
          let lastUsedRation = rationCollection.getRation(result.userId, loginTime);
          availableCollection.reduceAvailableFoodsAmount(result.userId, lastUsedRation.ration.ration);

          rationCollection.insertRationForDate(result.email, result.token, loginTime);
        }

        res.status(200).send({
          token: result.token,
          email: result.email
        });
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

  router.delete('/token', validateReqBody('body'), async(req, res) => {
    let email = req.body.email, password = req.body.password;
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