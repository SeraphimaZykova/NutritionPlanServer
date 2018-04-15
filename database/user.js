const 
    mongodb = require('mongodb')
  , mongo = require('./mongoManager')
  , pantry = require('./pantry')
  ;
 
async function get(id, projection) {
  let collection = mongo.user()
    , query = { 'clientId' : id }
    , opts = { projection: projection }
    ;
  
  let res = await collection.findOne(query, opts);
  return res;
}

async function insertIfNotExist(clientId) {
  let collection = mongo.user()
    , query = { 'clientId': clientId }
    ;
  
  let result = await collection.findOne(query);
  if (result)
    return null;

  let pantryId = await pantry.create();
  let userDoc = { 
    'clientId': clientId,
    'pantry': pantryId,
    'nutrition': {
      calories: 0,
      proteins: 0,
      carbs: 0,
      fats: 0
    } 
  };

  let insertRes = await collection.insert(userDoc);
  if (insertRes.result.ok == 1) {
    return null;
  }

  return insertRes;
}

function update(id, field, value) {
  let query = { 'clientId': id }
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