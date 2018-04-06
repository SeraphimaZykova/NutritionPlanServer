const 
    mongodb = require('mongodb')
  , mongo = require('./mongoManager')
  , user = require('./user')
  , pantry = require('./pantry')
  , rationCalculator = require('ration_calculator')
  ;
 
let get = async (id) => {
  let projection = { ration: 1, nutrition: 1, pantry: 1, _upd: 1 }
    , userData = await user.get(id, projection)
    , nutrition = userData['nutrition']
    , idealNutrition = {
        calories: {
          total: nutrition.calories
        },
        proteins: nutrition.calories * nutrition.proteins,
        carbs: {
          total: nutrition.calories * nutrition.carbs
        },
        fats: {
          total: nutrition.calories * nutrition.fats
        }
      }
    , userPantry = await pantry.get(id)
    ;

  if (!userData.ration) {
    let rationRes = await rationCalculator.calculateRation(idealNutrition, userPantry);
    userData.ration = rationRes.ration;
    set(id, rationRes.ration);
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

let set = async () => {

}

let add = async () => {

}

let update = async () => {

}

exports.get = get;
exports.set = set;
exports.add = add;
exports.update = update;
