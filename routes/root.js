module.exports = function (router) {

  // router.use(validateReqBody);

  router.get('/', (req, res)=> {
    res.status(200);
  });

  function validateReqBody(req, res, next) {
    res.status(200);

    // if (req.hasOwnProperty('VeryImportantProperty')) {
    //   next();
    // } else {
    //   res.send({
    //     status: false
    //     , data: 'Validation error'
    //   });
    // }
  }

  return router;
}