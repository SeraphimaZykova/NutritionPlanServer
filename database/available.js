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

async function update(userId, foodId, obj) {
  return await mongo.available().updateOne({
    userId: userId,
    foodId: foodId
  }, {
    $set: obj
  })
}

exports.get = get;
exports.insert = insert;
exports.update = update;
exports.remove = remove;