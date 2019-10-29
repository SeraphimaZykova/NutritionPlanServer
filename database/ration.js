const 
    mongodb = require('mongodb')
  , mongo = require('./mongoManager')
  , user = require('./user')
  , available = require('./available')
  , rationCalculator = require('ration_calculator')
  ;
 
  /*
  errors: 
  - 401 Unauthorized
  */
async function get(userId, localeLanguage, count) {
  let diary = await getDiary(userId, localeLanguage, count);
    
  //change dates to iOS decodable format
  diary.forEach(day => {
    day.date = iOSDateFormatString(day.date)
  });

  return diary;
}

async function update(email, token, ration) {
  ration.ration.forEach(el => {
    el.food = mongodb.ObjectId(el.food._id);
    delete el.dailyPortion;
    delete el.available;
  });

  let userData = await user.get(email, token, { _id: 1 })
  let date = new Date(ration.date)
  
  let res = await mongo.diary().updateOne({
    userId: userData._id,
    date: date
  }, {
    $set: {
      'ration.ration': ration.ration,
      'ration.nutrition': ration.nutrition,
      'ration.error': ration.error
    }
  })
  
  if (res.result.nModified == 1) {
    return true
  }
  return false
}

/**
 * prepare rations for user in advance for a several days
 * 
 * @param {string} email 
 * @param {string} token 
 * @param {int} days how many rations are needed
 * 
 * @returns array of created rations
 */
async function calculateRations(email, token, days) {
  let userData = await user.get(email, token, { userData: 1, nutrition: 1 });

  let startDate = await getNextRationDate(userData._id)
  let availableArr = await getNotReservedAvailable(userData._id, startDate);
  
  let rations = []
  let docs = []

  for (let i = 0; i < days; i++) {
    let date = formatDate(startDate, i);
    
    let ration = await calculateRation(userData.userData.nutrition, availableArr);

    if (ration.ration.length > 0) {
      rations.push(ration)
      availableArr = reserveAvailable(availableArr, ration.ration)
  
      docs.push({ 
        userId: userData._id,
        date: date,
        ration: ration
      })
    }
  }

  if (docs.length > 0) {
    await mongo.diary().insertMany(docs);
  }
  
  return rations
}

/**
 * prepare and replace rations for user in advance for a several days. all other rations will be removed
 * 
 * @param {string} email 
 * @param {string} token 
 * @param {[String]} dates, ISODate strings
 * 
 * @returns array of created rations
 */
async function recalculateRations(email, token, dates) {
  if (dates.length == 0) {
    return []
  }

  dates = dates.sort();

  let userData = await user.get(email, token, { userData: 1, nutrition: 1 });
  let firstRequestedDate = new Date(dates.sort()[0]);
  let availableArr = await getNotReservedAvailable(userData._id, firstRequestedDate);
  
  let rations = []
  
  //TODO: if dates doesn't follow each other, reserve correctly
  for (let i = 0; i < dates.length; i++) {
    let date = new Date(dates[i])

    let ration = await calculateRation(userData.userData.nutrition, availableArr);
    rations.push(ration)
    availableArr = reserveAvailable(availableArr, ration.ration)

    let res = await mongo.diary().updateOne({
      userId: userData._id,
      date: date,
    }, {
      $set: {
        userId: userData._id,
        date: date,
        ration: ration
      }
    });
  }

  return rations
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
 * @param {ObjectId} userId ObjectId
 * @param {string} localeLanguage determines which translation will be set as name
 * @param {int} count
 */
async function getDiary(userId, localeLanguage, count) {
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
    { $addFields: { 'ration.ration.food.name': {
          $cond: { 
            if: '$ration.ration.food.name.' + localeLanguage, 
            then: '$ration.ration.food.name.' + localeLanguage , 
            else: '$ration.ration.food.name.en' 
          } 
        }
      }
    },
    { $lookup: {
      from: "Available",
      let: { foodId: "$ration.ration.food._id", userId: userId },
      pipeline: [
        { $match: 
          { $expr:
            { $and:
               [
                 { $eq: [ "$foodId",  "$$foodId" ] },
                 { $eq: [ "$userId", "$$userId" ] }
               ]
            }
          }
        },
        { $project: { 'available': 1, '_id': 0 } }
      ],
      as: "ration.ration.available"
    }
  },
  { $addFields: { 'ration.ration.available': { $arrayElemAt: ['$ration.ration.available.available', 0] } }
},
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
 * @param {*} nutrition 
 * @param {*} available 
 * 
 * @returns ration obj
 */
async function calculateRation(nutrition, available) {
  try {
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
    return rationRes

  } catch (err) {
    let rationRes = {
      ration: [],
      error: {
        "caloriesError": 1,
        "proteinsError": 1,
        "carbsError": 1,
        "fatsError": 1
      },
      nutrition: {
        calories: {
          total: 0
        },
        carbs: {
          total: 0
        },
        fats: {
          total: 0
        },
        proteins: 0
      }
    }

    return rationRes
  }
}

/**
 * request array of available foods, 
 * request array of rations between 'today' and 'firstRequestedDate',
 * reduces available by reserved values
 * 
 * @param {'ObjectId'} userId
 * @param {Date} firstRequestedDate
 * @returns {['Available']} available array
 */
async function getNotReservedAvailable(userId, firstRequestedDate) {
  let availableArr = await available.getAvailable(userId); 
  let today = formatDate(new Date());

  let rations = await mongo.diary().aggregate([
    { $match: { 
        $and: [
        { userId: userId },
        { date: { $gte: today } },
        { date: { $lt: firstRequestedDate } }
        ]}
    },
  ]).toArray()

  rations.forEach(rationEl => {
    let rationFoodsArr = rationEl.ration.ration;
    availableArr = reserveAvailable(availableArr, rationFoodsArr);
  });

  return availableArr
}

/**
 * reduces available by reserved values
 * 
 * @param {['Available']} available
 * @param {'[Food]'} rationFoodsArr
 * @returns {['Available']} modified available array
 */
function reserveAvailable(available, rationFoodsArr) {
  rationFoodsArr.forEach(food => {
    let availableIndex = available.findIndex((el, index, array) => {
      return el.food._id.toString() == food.food.toString()
    });

    if (availableIndex != -1) {
      available[availableIndex].available -= food.portion;
      if (available[availableIndex].available < 0) {
        available[availableIndex].available = 0;
      }
    }
  });

  return available
}

/**
 * formats date to ISO string decodable on iOS
 * @param {Date} date 
 */
function iOSDateFormatString(date) {
  let str = date.toISOString().substr(0, 10) + "T00:00:00Z";
  return str;
}

/**
 * returns date from last ration entry + 1 day.
 * if there is no records or last created ration were earlier than current date, returns current date
 */
async function getNextRationDate(userId) {
  let now = new Date();
  let today = formatDate(now);
  let date = today;

  console.log('now: ', now);
  console.log('today: ', today); 

  let lastRationEntry = await mongo.diary().aggregate([
    { $match: { userId: userId } },
    { $sort: { date: -1 } },
    { $limit: 1 }
  ]).toArray();
  lastRationEntry = lastRationEntry[0];

  console.log('lastRationEntry.date: ', lastRationEntry.date);

  if (lastRationEntry && lastRationEntry.date >= today) {
    let lastDate = lastRationEntry.date;
    let nextDate = formatDate(lastDate, 1);
    date = nextDate;
  } 

  console.log('date: ', date);
  return date;
}

/**
 * Removes time values from date, it keeps only day, month and year.
 * Also can increase days with daysInc value
 * 
 * @param {Date} date
 * @param {int} daysInc 
 * @returns Date
 */
function formatDate(date, daysInc = 0) {
  return new Date(date.getYear() + 1900, date.getMonth(), date.getDate() + daysInc, 3);
}

exports.get = get;
exports.update = update;
exports.calculateRations = calculateRations;
exports.recalculateRations = recalculateRations;