const 
    mongodb = require('mongodb')
  , mongo = require('./mongoManager')
  , user = require('./user')
  , food = require('./food')
  ;
 
async function get(userId) {
  let cursor = await mongo.available().aggregate([
      { $match: { userId: userId } },
      { $lookup: {
          from: "Food",
          localField: "foodId",
          foreignField: "_id",
          as: "food"
          } 
      },
      { $addFields: { food: { $arrayElemAt: [ "$food", 0] } } },
      { $project: { "_id": 0, "foodId": 0, "food._id": 0, "userId": 0 } }
    ]);

  let doc = await cursor.toArray();
  return doc;
}


async function insert(obj) {
  res = await mongo.available().insertOne(obj);
  console.log(res);
}

async function remove(userId, foodToRemoveId) {
  let userData = await user.get(userId, { pantry: 1 })
    , pantryId = userData['pantry']
    , collection = mongo.available()
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
    , collection = mongo.available()
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