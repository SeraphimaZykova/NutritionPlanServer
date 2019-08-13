const 
    mongodb = require('mongodb')
  , mongo = require('./mongoManager')
  , user = require('./user')
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
  return await mongo.available().insertOne(obj);
}

async function remove(userId, foodToRemoveId) {
  return await mongo.available().deleteOne({
    userId: userId, 
    foodId: mongodb.ObjectId(foodToRemoveId)
  });
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