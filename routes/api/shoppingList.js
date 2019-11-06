module.exports = function (router) {
  const user = require('../../database/user');

  router.get('/', validateReqQuery, async (req, res) => {
    try {
      let email = req.query.email
        , token = req.query.token;

      console.log(email, token)
      let result = await user.getByEmail(email, token, {'shoppingList': 1, 'recentPurchases': 1, '_id': 0});
      console.log('shopping list request: ', result)
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

  router.post('/update', validatePost, async (req, res) => {
    try {
      let email = req.body.email
        , token = req.body.token
        , shoppingList = req.body.shoppingList
        , recentPurchases = req.body.recentPurchases;

      console.log('update shopping list data: ', shoppingList, recentPurchases)
      let result = await user.update(email, token, 'shoppingList', shoppingList);
      console.log(result);

      result = await user.update(email, token, 'recentPurchases', recentPurchases);
      console.log(result);

      res.status(200).send({});

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
    if (req.body.hasOwnProperty('shoppingList') && req.body.hasOwnProperty('recentPurchases') 
      && req.body.hasOwnProperty('email') && req.body.hasOwnProperty('token')) {
      next();
    } else {
      res.status(400).send({
        error: 'invalid request: data missing'
      });
    }
  }

  return router;
}