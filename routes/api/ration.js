module.exports = function (router) {
  const ration = require('../../database/ration');

  router.get('/', validateReqBody, async (req, res) => {
    try {
      let email = req.query.email
        , token = req.query.token;

      let result = await ration.get(email, token);
      res.status(200).send(result);
    } catch(err) {
      console.log(`Error: ${err.message}`)
      res.send({
        status: false
        , data: err.message
      });
    }
  });

  // router.post('/updateRation', async (req, res) => {
  //   const data = req.body;
  //   try {
  //     await ration.update(data.userId, data.id, 'portion', data.portion);
  //     res.sendStatus(200);
  //   }
  //   catch(err) {
  //     handleError(res, 400, err);
  //   }
  // });

  router.post('/update', validateInsert, async (req, res) => {
    try {
      
    } catch(err) {
      console.log(`Error: ${err.message}`)
      res.send({
        status: false
        , data: err.message
      });
    }
  });

  function validateReqBody(req, res, next) {
    if (req.query.hasOwnProperty('email') && req.query.hasOwnProperty('token')) {
      next();
    } else {
      res.status(400).send({
        error: 'invalid request'
      });
    }
  }

  function validateInsert(req, res, next) {
    console.log(req.body)
    if (req.body.hasOwnProperty('email') && req.body.hasOwnProperty('token') && req.body.hasOwnProperty('ration')) {
      next();
    } else {
      res.status(400).send({
        error: 'invalid request'
      })
    }
  }

  return router;
}