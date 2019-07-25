module.exports = function (router) {
  const foodCollection = require('../../database/food');

  router.get('/search', validateReqBody, async (req, res) => {
    try {
      let args = req.query['args'];
      let result = await foodCollection.search(args);
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

  router.post('/insert', async (req, res) => {
    res.status(404).send();
  });

  function validateReqBody(req, res, next) {
    if (req.query.hasOwnProperty('args')) {
      next();
    } else {
      res.status(400).send('Error: 400 -> no search args');
    }
  }

  return router;
}