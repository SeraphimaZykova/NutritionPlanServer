const 
    mongodb = require('mongodb')
  , mongo = require('./mongoManager')
  ;
 
function get(id, projection) {
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

function insert(obj) {
  return new Promise((rslv, rjct) => {
    rjct('operation rejected');
  });
}

function update(id, field, value) {
  let query = { '_id': mongodb.ObjectId(id) }
    , upd = {}
    ;

  upd[field] = value;
  return new Promise((rslv, rjct) => {
    let collection = mongo.user();
    let callback = (err, res) => {
      if (err) {
        rjct(err);
        return;
      }
      rslv(res);
    };

    collection.updateOne(query, { $set: upd }, callback);
  });
}

exports.get = get;
exports.insert = insert;
exports.update = update;