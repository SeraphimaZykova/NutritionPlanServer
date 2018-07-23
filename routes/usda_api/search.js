module.exports = function (router) {
  const usda = require('../../usda/usda');

  router.use(validateReqBody);

  router.get('/', async (req, res) => {
    try {
      let args = req.query['args'];
      let result = await usda.search(args);
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

  function validateReqBody(req, res, next) {
    if (req.query.hasOwnProperty('args')) {
      next();
    } else {
      res.status(400).send('Error: 400 -> no search args');
    }
  }

  return router;
}