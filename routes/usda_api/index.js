module.exports = function (express) {

  const router = express.Router();
  
  router.use('/search', require('./search')(express.Router()));
  
  return router
}