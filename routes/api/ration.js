module.exports = function (router) {
  const rationCollection = require('../../database/ration');
  const userCollection = require('../../database/user');

  router.get('/', validateReqQuery, async (req, res) => {
    try {
      let email = req.query.email
        , token = req.query.token
        , count = req.query.count;

        let userData = await userCollection.get(email, token, { userData: 1 });
        if (!userData) {
          res.status(401).send({
            code: 401, 
            error: "Unauthorized"
          });
          return;
        }

      let result = await rationCollection.get(userData._id, userData.userData.localeLanguage, count);
      res.status(200).send(result);
    } catch(err) {
      console.log(`Error: ${err.message}`)
      res.status(406).send({
        status: false, 
        error: err.message
      });
    }
  });

  /**
   * @param {[ISODate]} dates of rations to replace with new calculated (updates database)
   * @param {int} count how many rations shold be created (inserts new)
   * 
   * @returns array of cretated rations
   */
  router.post('/', validatePost, async (req, res) => {
    try {
      let email = req.body.email
      , token = req.body.token
      , count = req.body.count
      , dates = req.body.dates;

      let userData = await userCollection.get(email, token, { userData: 1 });
      if (!userData) {
        res.status(401).send({
          code: 401, 
          error: "Unauthorized"
        });
        return;
      }

      let generatedRations = []
      if (count) {
        generatedRations = await rationCollection.calculateRations(email, token, count);
      } else if (dates) {
        generatedRations = await rationCollection.recalculateRations(email, token, dates);
      }

      if (generatedRations && generatedRations.length > 0) {
        // generated ration doesn't contain all info needed for client
        let aggregatedRations = await rationCollection.get(userData._id, userData.userData.localeLanguage, generatedRations.length)
        res.send(aggregatedRations) 
      } else {
        res.send([])
      }
      
    } catch(err) {
      console.log(`Error: ${err.message}`)
      res.status(406).send({
        code: 406, 
        error: err.message
      });
    }
  });

  router.put('/', validatePut, async (req, res) => {
    try {
      let email = req.body.email
      , token = req.body.token
      , ration = req.body.ration
      , replaceFollowingRations = req.body.replaceFollowingRations;

      if (await rationCollection.update(email, token, ration)) {
        res.send({})
      } else {
        res.status(406).send({
          error: "document was not updated"
        })
      }
      
    } catch(err) {
      console.log(`Error: ${err.message}`)
      res.status(406).send({
        status: false, 
        error: err.message
      });
    }
  })

  function validateReqQuery(req, res, next) {
    if (req.query.hasOwnProperty('email') && req.query.hasOwnProperty('token') && req.query.hasOwnProperty('count')) {
      next();
    } else {
      res.status(400).send({
        error: 'invalid request'
      });
    }
  }

  function validatePost(req, res, next) {
    if (req.body.hasOwnProperty('email') 
    && req.body.hasOwnProperty('token')) {
      next();
    } else {
      res.status(400).send({
        error: 'invalid request'
      })
    }
  }

  function validatePut(req, res, next) {
    if (req.body.hasOwnProperty('email') 
    && req.body.hasOwnProperty('token') 
    && req.body.hasOwnProperty('ration')
    && req.body.hasOwnProperty('replaceFollowingRations')) {
      next();
    } else {
      res.status(400).send({
        error: 'invalid request'
      })
    }
  }

  return router;
}