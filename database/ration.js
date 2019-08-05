const 
    mongodb = require('mongodb')
  , mongo = require('./mongoManager')
  , user = require('./user')
  , pantry = require('./pantry')
  , rationCalculator = require('ration_calculator')
  ;
 
async function get (email, token) {
  let projection = { ration: 1, userData: 1, pantry: 1, _upd: 1 }
    , userData = await user.get(email, token, projection)
    , userPantry = await pantry.get(email, token)
    ;

  if (!userData.ration) {
    let rationRes = await rationCalculator.calculateRation(idealNutrition, userPantry);
    userData.ration = rationRes.ration;
    set(email, token, rationRes.ration);
  }

  let arr = userData.ration.map((element) => {
    let pObj = userPantry.find(e => e.food['_id'].toString() === element['food'].toString());
    if (pObj) {
      element['food'] = pObj['food'];
      element['available'] = pObj['available'];
      element['daily'] = pObj['daily'];
    }
    return element;
  });

  return arr;
}

async function set(email, token, ration) {
  user.update(email, token, 'ration', ration);
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

exports.get = get;
exports.set = set;
exports.add = add;
exports.update = update;