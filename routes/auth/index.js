module.exports = function (express) {

  const router = express.Router();
  
  router.use('/', require('./auth')(express.Router()));
  
  return router
}