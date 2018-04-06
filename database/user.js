const 
    mongodb = require('mongodb')
  , mongo = require('./mongoManager')
  ;
 
let get = (id, projection) => {
  let query = mongodb.ObjectId(id)
    , opts = { projection: projection };
  
  return new Promise((rslv, rjct) => {
    let collection = mongo.user();
    let callback = (err, res) => {
      if (err) {
        rjct(err);
        return;
      }
      rslv(res);
    };

    collection.findOne(query, opts, callback);
  });
}

let insert = (obj) => {
  return new Promise((rslv, rjct) => {
    rjct('operation rejected');
  });
}

exports.get = get;
exports.insert = insert;
