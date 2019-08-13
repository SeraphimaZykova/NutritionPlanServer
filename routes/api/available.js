module.exports = function (router) {
  const userCollection = require('../../database/user');
  const availableCollection = require('../../database/available');
  const mongodb = require('mongodb')

  router.get('/', validateAvailable, async (req, res) => {
    try {
      let token = req.query.token
        , userEmail = req.query.email;

      let userDoc = await userCollection.get(userEmail, token, {'_id': 1 });
      if (userDoc) {
        let result = await availableCollection.get(userDoc._id)
        res.status(200).send(result);
      } else {
        res.status(401).send({
          error: "user not found"
        })
      }
    }
    catch(err) {
      console.log(`Error: ${err.message}`)
      res.send({
        status: false
        , data: err.message
      });
    }
  });


  router.post('/add', validateAvailableAdd, async (req, res) => {
    try {
      let token = req.body.token
        , userEmail = req.body.email;
      let userDoc = await userCollection.get(userEmail, token, {'_id': 1 });
      
      if (userDoc) {
        let obj = {
          "userId": userDoc._id,
          "foodId": mongodb.ObjectId(req.body.info.id),
          "available": req.body.info.available,
          "delta": req.body.info.delta,
          "dailyPortion": {
            "min": req.body.info.min,
            "max": req.body.info.max,
            "preferred": req.body.info.preferred
          }
        };

        await availableCollection.insert(obj);
        res.status(200).send({});
      } else {
        res.status(401).send({
          status: false, 
          error: "user not found"
        })
      }
    }
    catch(err) {
      console.log(`Error: ${err.message}`)
      res.status(406).send({
        status: false, 
        error: err.message
      });
    }
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

  function validateAvailableAdd(req, res, next) {
    if (req.body.hasOwnProperty('token') && req.body.hasOwnProperty('email') && req.body.hasOwnProperty('info')) {
      next();
    } else {
      res.status(400).send({
        error: "invalid request"
      });
    }
  }

  return router;
}