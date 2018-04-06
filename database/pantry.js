const 
    mongodb = require('mongodb')
  , mongo = require('./mongoManager')
  , user = require('./user')
  ;
 
async function get(id) {
  let userData = await user.get(id, { pantry: 1 })
    , pantryId = userData['pantry']
    , collection = mongo.pantry()
    , doc = await collection.findOne(pantryId)
    ;

  if (!doc) throw new Error('pantry not found');

  return doc['foodstuff'];
}

async function insert(id, obj) {
  obj.foodId = mongodb.ObjectId(obj.foodId);

  let userData = await user.get(id, { pantry: 1 })
    , pantryId = userData['pantry']
    , collection = mongo.pantry()
    , query = {
        '_id': pantryId,
        'foodstuff.foodId': { $nin: [ obj.foodId ] }
      }
    , upd = { $push: { 'foodstuff': obj } }
    ;

  res = await collection.findOneAndUpdate(query, upd);
  if (res.lastErrorObject.updatedExisting == false) {
    throw new Error('Object not found');
  }
}

async function remove(userId, foodToRemoveId) {
  let userData = await user.get(userId, { pantry: 1 })
    , pantryId = userData['pantry']
    , collection = mongo.pantry()
    , query = { '_id': pantryId }
    , upd = { $pull: { 'foodstuff': { 'foodId': mongodb.ObjectId(foodToRemoveId) } } }
    ;

  res = await collection.findOneAndUpdate(query, upd);
  if (res.lastErrorObject.updatedExisting == false) {
    throw new Error('Object not found');
  }
}

async function update(userId, updId, field, val) {
  let userData = await user.get(userId, { 'pantry': 1 })
    , pantryId = userData['pantry']
    , collection = mongo.pantry()
    , query = {
        "_id": pantryId,
        "foodstuff.foodId": mongodb.ObjectId(updId)
      }
    , updObj = {}
    ;

  updObj['foodstuff.$.' + field] = val;

  res = await collection.findOneAndUpdate(query, { $set: updObj });
  if (res.lastErrorObject.updatedExisting == false) {
    throw new Error('Object not found');
  }
}

exports.get = get;
exports.insert = insert;
exports.update = update;
exports.remove = remove;