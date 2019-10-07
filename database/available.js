const 
    mongodb = require('mongodb')
  , mongo = require('./mongoManager')
  , user = require('./user')
  ;
 
async function getAvailable(userId, localeLanguage) {
  let cursor = await mongo.available().aggregate([
      { $match: { userId: userId } },
      { $lookup: {
          from: "Food",
          localField: "foodId",
          foreignField: "_id",
          as: "food"
          } 
      },
      { $addFields: { food: { $mergeObjects: { $arrayElemAt: [ "$food", 0 ] } } } },
      { $addFields: { 'food.name': {
            $cond: { 
              if: '$food.name.' + localeLanguage, 
              then: '$food.name.' + localeLanguage , 
              else: '$food.name.en' 
            } 
          }
        }
      },
      { $project: { "_id": 0, "foodId": 0, "userId": 0 } }
    ]);

  let doc = await cursor.toArray();
  return doc;
}

async function getFood(id) {
  let cursor = await mongo.available().aggregate([
      { $match: { _id: id } },
      { $lookup: {
          from: "Food",
          localField: "foodId",
          foreignField: "_id",
          as: "food"
          } 
      },
      { $addFields: { food: { $mergeObjects: { $arrayElemAt: [ "$food", 0] } } } },
      { $project: { "_id": 0, "foodId": 0, "userId": 0 } }
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

async function update(userId, food) {
  return await mongo.available().updateOne({
    userId: userId,
    foodId: mongodb.ObjectId(food.food._id)
  }, {
    $set: {
      available: food.available,
      delta: food.delta,
      dailyPortion: food.dailyPortion
    }
  });
}

exports.getAvailable = getAvailable;
exports.getFood = getFood;
exports.insert = insert;
exports.update = update;
exports.remove = remove;