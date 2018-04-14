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

async function insertIfNotExist(clientId) {
  let collection = mongo.user()
    , query = { 'clientId': clientId }
    ;
  
  let result = await collection.findOne(query);
  if (result)
    return null;

  let userDoc = {
    'clientId': clientId,
    'nutrition': {},
    'pantry': []
  };
  let insertRes = await collection.insert(userDoc);
  if (insertRes.result.ok == 1) {
    return null;
  }

  return insertRes;
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
exports.insertIfNotExist = insertIfNotExist;
exports.update = update;