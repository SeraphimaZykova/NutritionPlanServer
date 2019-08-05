module.exports = function (express) {

  const router = express.Router();
  
  router.use('/food', require('./food')(express.Router()));
  router.use('/settings', require('./settings')(express.Router()));
  router.use('/shoppingList', require('./shoppingList')(express.Router()));
  router.use('/available',require('./available')(express.Router()));
  router.use('/ration', require('./ration')(express.Router()));
  
  return router
}