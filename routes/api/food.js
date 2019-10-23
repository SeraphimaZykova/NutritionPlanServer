module.exports = function (router) {
  const foodCollection = require('../../database/food');
  const translate = require('translate');

  translate.engine = process.env.TRANSLATE_ENGINE;
  translate.key = process.env.TRANSLATE_ENGINE_KEY;

  router.get('/search', validateReqBody, async (req, res) => {
    try {
      let args = req.query.args;
      let lang = req.query.lang;
      
      let result = await foodCollection.search(args, lang);
      res.status(200).send(result);
    } catch(err) {
      console.log(`Error: ${err.message}`)
      res.send({
        status: false
        , data: err.message
      });
    }
  });

  router.post('/add', validateInsert, async (req, res) => {
    try {
      //todo check credentials to prevent unauthorised access
      let food = req.body.food.food;

      console.log('insert', food)
      let insertedId = await foodCollection.insert(food);
      console.log('res id: ', insertedId)
      res.send({
        id: insertedId
      })
    } catch(err) {
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
      res.status(400).send({
        error: 'invalid request'
      });
    }
  }

  function validateInsert(req, res, next) {
    console.log(req.body)
    if (req.body.hasOwnProperty('food')) {
      next();
    } else {
      res.status(400).send({
        error: 'invalid request'
      })
    }
  }

  return router;
}