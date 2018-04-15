const 
    mongodb = require('mongodb')
  , mongo = require('./mongoManager')
  , user = require('./user')
  , food = require('./food')
  ;
 
async function get(id) {
  let userData = await user.get(id, { pantry: 1 })
    , pantryId = userData['pantry']
    ;

  if (!pantryId) throw new Error('pantry is empty');

  let collection = mongo.pantry()
    , doc = await collection.findOne(pantryId)
    ;

  if (!doc || !doc.foodstuff) throw new Error('pantry not found');

  let arr = await Promise.all(doc.foodstuff.map(async (element) => {
    element['food'] = await food.get(element.foodId);
    element['foodId'] = element.foodId.toString();
    return element;
  }));

  return arr;
}

async function create() {
  let collection = mongo.pantry()
    , obj = { 'foodstuff': [] }
    , res = await collection.insert(obj)
    ;
  return res.insertedIds['0'];
}

async function insert(id, obj) {
  obj.foodId = mongodb.ObjectId(obj.foodId);

  let userData = await user.get(id, { pantry: 1 })
    , pantryId = userData['pantry']
    ;

  if (!pantryId) throw new Error('Insert failed: no pantry');

  let collection = mongo.pantry()
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
exports.create = create;
exports.insert = insert;
exports.update = update;
exports.remove = remove;