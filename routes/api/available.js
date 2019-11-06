module.exports = function (router) {
  const userCollection = require('../../database/user');
  const availableCollection = require('../../database/available');
  const rationCollection = require('../../database/ration');
  const mongodb = require('mongodb')

  /*
  errors: 
  - 401 Unauthorized
  */
  router.get('/', validateAvailable, async (req, res) => {
    try {
      let token = req.query.token
        , email = req.query.email;

      let userDoc = await userCollection.getByEmail(email, token, {'_id': 1, 'userData.localeLanguage': 1 });
      if (userDoc) {
        let result = await availableCollection.getAvailable(userDoc._id, userDoc.userData.localeLanguage);
        res.status(200).send(result);
      } else {
        res.status(401).send({
          code: 401,
          error: "Unauthorized"
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

  router.post('/', validateAvailableAdd, async (req, res) => {
    try {
      let token = req.body.token
        , email = req.body.email
        , info = req.body.info
        , lastRationDate = req.body.lastRationDate;
      let userDoc = await userCollection.getByEmail(email, token, {'_id': 1, 'userData': 1 });
      if (!userDoc) {
        res.status(401).send({
          status: false, 
          error: "user not found"
        })
      }

      if (info) {
        let obj = {
          "userId": userDoc._id,
          "foodId": mongodb.ObjectId(info.id),
          "available": info.available,
          "delta": info.delta,
          "dailyPortion": {
            "min": info.min,
            "max": info.max,
            "preferred": info.preferred
          }
        };

        let insertRes = await availableCollection.insert(obj);
        let food = await availableCollection.getFood(insertRes.insertedId);
        res.status(200).send(food);

      } else if (lastRationDate) {
        let ration = await rationCollection.getRation(userDoc._id, new Date(lastRationDate));
        await availableCollection.reduce(userDoc._id, ration.ration.ration);
        
        let available = await availableCollection.getAvailable(userDoc._id, userDoc.userData.localeLanguage);
        res.status(200).send(available);
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

  router.delete('/', validateAvailableRemove, async (req, res) => {
    try {
      let token = req.body.token
        , email = req.body.email
        , removableId = req.body.foodId;
      let userDoc = await userCollection.getByEmail(email, token, {'_id': 1 });

      if (userDoc) {
        await availableCollection.remove(userDoc._id, removableId);
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

  router.put('/', validatePut, async (req, res) => {
    try {
      let token = req.body.token
        , email = req.body.email;
      let userDoc = await userCollection.getByEmail(email, token, {'_id': 1 });
      
      if (userDoc) {
        let result = await availableCollection.update(userDoc._id, req.body.food);
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
  })

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
    if (req.body.hasOwnProperty('token') && req.body.hasOwnProperty('email')) {
      next();
    } else {
      res.status(400).send({
        error: "invalid request"
      });
    }
  }

  function validateAvailableRemove(req, res, next) {
    if (req.body.hasOwnProperty('token') && req.body.hasOwnProperty('email') && req.body.hasOwnProperty('foodId')) {
      next();
    } else {
      res.status(400).send({
        error: "invalid request"
      });
    }
  }

  function validatePut(req, res, next) {
    if (req.body.hasOwnProperty('token') && req.body.hasOwnProperty('email') && req.body.hasOwnProperty('food')) {
      next();
    } else {
      res.status(400).send({
        error: "invalid request"
      });
    }
  }

  return router;
}