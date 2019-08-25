const 
    mongodb = require('mongodb')
  , mongo = require('./mongoManager')
  , user = require('./user')
  , available = require('./available')
  , rationCalculator = require('ration_calculator')
  ;
 
async function get(email, token, count) {
  let userData = await user.get(email, token, { userData: 1 })
    , diary = await getDiary(userData._id, count)
    , availableArr = await available.getAvailable(userData._id);

  //check if there is today ration calculated
  let addToDatabase = (diary.length == 0);
  let today = new Date();
  if (!addToDatabase) {
    addToDatabase = true;
    diary.forEach(day => {
      if (day.date.year == today.year
        && day.date.month == today.month
        && day.date.day == today.day ) {
        addToDatabase = false;
      }
    });
  }

  if (addToDatabase) {
    await calculateAndSaveRation(userData._id, today, userData.userData.nutrition, availableArr);
    diary = getDiary(userData._id, count)
  }

  //change dates to iOS decodable format
  diary.forEach(day => {
    day.date = iOSDateFormatString(day.date)
    day.ration.forEach(foodEl => {
      let availFood = availableArr.filter(el => String(el.food._id) == String(foodEl.food._id))
      if (availFood.length > 0) {
        foodEl.available = availFood[0].available
      }
    });
  });
  return diary;
}

async function add(id, obj) {
  let collection = mongo.user()
    , query = { '_id': mongodb.ObjectId(id) }
    , upd = { $push: { 'ration': obj } }
    ;

  res = await collection.findOneAndUpdate(query, upd);
  if (res.lastErrorObject.updatedExisting == false) {
    throw new Error('Object not found');
  }
}

async function update(id, foodId, field, value) {
  let collection = mongo.user()
    , query = { 
        '_id': mongodb.ObjectId(id),
        'ration.food': foodId
      }
    , upd = {}
    ;

  upd['ration.$.' + field] = value;
  res = await collection.findOneAndUpdate(query, { $set: upd });
  if (res.lastErrorObject.updatedExisting == false) {
    throw new Error('Object not found');
  }
}

async function prep(email, token, days) {
  let userData = await user.get(email, token, { userData: 1, nutrition: 1 });
  let availableArr = await available.getAvailable(userData._id);
  
  let date = new Date();
  for (let i = 0; i <= days; i++) {
    await calculateAndSaveRation(userData._id, date
      , userData.userData.nutrition, availableArr);
    
    date.setTime(date.getTime() + 24 * 60 * 60 * 1000);
    
    //reserve available
  }
}

/** 
 * cast user nutrition to addon required format 
 * @param {*} nutrition : nutrition from UserData (format is different from food nutrition)
 * @todo float arithmetic operations, better to keep values in database
*/
function userToAddonNutrition(userNutrition) {
  return {
    calories: {
      total: userNutrition.calories
    },
    carbs: {
      total: userNutrition.carbs.kcal
    },
    fats: {
      total: userNutrition.fats.kcal
    },
    proteins: userNutrition.proteins.kcal
  }
}

/**
 * aggregates diary with appropriate data substitution
 * @param {*} userId ObjectId
 */
async function getDiary(userId, count) {
  return await mongo.diary().aggregate([
    { $match: { userId: userId } },
    { $sort: { date: -1 } },
    { $limit: parseInt(count) },
    { $unwind: { path: '$ration.ration' } },
    { $lookup: {
        from: "Food",
        localField: "ration.ration.food",
        foreignField: "_id",
        as: "ration.ration.foods"
      }
    },
    { $addFields: { 'ration.ration.food': { $mergeObjects: { $arrayElemAt: [ '$ration.ration.foods', 0 ] } } }}, 
    { $group: { _id: '$date', 
          ration: { $push: '$ration.ration' },
          error: { $mergeObjects: '$ration.error' },
          nutrition: { $mergeObjects: '$ration.nutrition' }
         } },
    { $addFields: { 'date': '$_id' }}, 
    { $sort: { date: -1 } },  
    { $project: { "_id": 0, "userId": 0, 'ration.foods': 0 } } 
  ]).toArray();
}

/**
 * calculates ration and saves in database
 * @param {*} userId 
 * @param {*} date
 * @param {*} nutrition 
 * @param {*} available 
 */
async function calculateAndSaveRation(userId, date, nutrition, available) {
  let rationRes = await rationCalculator.calculateRation(userToAddonNutrition(nutrition), available);
    
  rationRes.ration.forEach((el) => {
    el.food = mongodb.ObjectId(el.food)
  })
  rationRes.nutrition = {
    calories: {
      total: rationRes.nutrition.calories
    },
    carbs: {
      total: rationRes.nutrition.carbs / 4.1
    },
    fats: {
      total: rationRes.nutrition.fats / 9.29
    },
    proteins: rationRes.nutrition.proteins / 4.1
  }

  mongo.diary().insertOne({
    userId: userId,
    date: date,
    ration: rationRes
  });
}

/**
 * formats date to ISO string decodable on iOS
 * @param {*} date 
 */
function iOSDateFormatString(date) {
  let str = date.toISOString().substr(0, 10) + "T00:00:00Z";
  return str;
}

exports.get = get;
exports.add = add;
exports.update = update;
exports.prep = prep;