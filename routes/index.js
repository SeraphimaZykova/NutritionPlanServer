const
    express = require('express')
  , mongo = require('./../database/mongoManager')
  , router = express.Router()
  , HARDCODED_USER_ID = '5a4aafeae02a03d8ebf35361'
  , nutritionix = require('../api/nutritionix')
  , ration = require('ration_calculator')
  , converter = require('./documentConverter')
  ;

let handleError = (routerRes, code, info) => {
  console.error('Error: ' + code + ' -> ' + info);
  routerRes.json({
    status: 'fail'
    , message: 'Error: ' + code + ' -> ' + info
  });
}

let modifyPantryObj = (pantryObj, userId) => {
  return mongo.getFood(pantryObj.foodId)
  .then(food => {
    return converter.clientPantry(food, pantryObj, userId);
  })
  .catch(err => {
    console.error(err);
    return null;
  });
}

let modifyPantryForRation = (pantryObj) => {
  return mongo.getRationFood(pantryObj.foodId)
  .then(food => {
    return converter.rationPantry(food, pantryObj);
  })
  .catch(err => {
    console.error(err);
    return null;
  });
}

let removeUndef = (array) => {
  let undefIndex = array.indexOf(undefined);
  while (undefIndex != -1) {
    array.splice(undefIndex, 1);
    undefIndex = array.indexOf(undefined);
  }
  return array;
}

function requestPantry(response) {
  mongo.getPantry(HARDCODED_USER_ID)
  .then(pantry => {
    Promise.all(pantry.map((fObj) => {
      return modifyPantryObj(fObj, HARDCODED_USER_ID);
    })).then(rslv => {
      rslv = removeUndef(rslv);
      response.send(rslv);
    })
    .catch(err => {
      console.log(`error: ${err}`);
      handleError(response, 200, err);
    });
  }) 
  .catch(err => {
    console.log(`error: ${err}`);
    handleError(response, 200, err);
  });
}
  
let updPantry = (pantry) => {
  return Promise.all(pantry.map((pantryObj) => {
    return modifyPantryForRation(pantryObj, HARDCODED_USER_ID);
  }));
}

let getPantryObj = (pantry, id) => {
  for (let i = 0; i < pantry.length; i++) {
    if (pantry[i].food._id == id) {
      return pantry[i];
    }
  }
}

function requestRation(response) {
  let projection = { nutrition: 1 };
  mongo.getUserInfo(HARDCODED_USER_ID, projection)
  .then(res => {
    const idealNutrition = {
      calories: {
        total: res.nutrition.calories
      },
      proteins: res.nutrition.calories * res.nutrition.proteins,
      carbs: {
        total: res.nutrition.calories * res.nutrition.carbs
      },
      fats: {
        total: res.nutrition.calories * res.nutrition.fats
      }
    };

    updPantry(res.pantry)
    .then(modifiedPantry => {
      ration.calculateRation(idealNutrition, modifiedPantry)
      .then(rationResult => {
        rationResult.ration.forEach(element => {
          let pObj = getPantryObj(modifiedPantry, element.food);
          
          element.food = pObj.food;
          element.available = pObj.available;
          element.delta = pObj.delta;
          element.daily = pObj.daily;
        });

        response.send(rationResult);
      })
      .catch(err => {
        handleError(response, 200, err);
        console.error(err);
      })
    })
    .catch(err => {
      handleError(response, 200, err);
      console.error(err);
    })
  })
  .catch(err => {
    handleError(response, 200, err);
    console.error(err);
  });
}

function updatePantry(responce, userId, updOid, field, val) {
  mongo.updatePantry(userId, updOid, field, val)
  .then(result => {
    console.log(result);
    responce.send(result);
  })
  .catch(err => {
    console.log(err);
    handleError(responce, 200, err);
  });
}

function updateFood(responce, updOid, field, val) {
  mongo.updateFood(updOid, field, val)
  .then(result => {
    console.log(result);
    responce.send(result);
  })
  .catch(err => {
    console.log(err);
    handleError(responce, 200, err);
  });
}

async function addNewFood(responce, userId, data) {
  let foodstuff = {
    name: data.name,
    glycemicIndex: data.glycemicIndex,
    nutrition: data.nutrition
  };

  mongo.insertFood(foodstuff)
  .then(insertedOId => {
    let pantryObj = {
      foodId: insertedOId,
      delta: data.delta,
      available: data.available,
      daily: data.daily
    }

    mongo.pushToPantry(userId, pantryObj)
    .then(res => {
      responce.sendStatus(400);
    })
    .catch(err => {
      console.log(err);
      handleError(responce, 200, err);
    })
  })
  .catch(err => {
    console.log(err);
    handleError(responce, 200, err);
  });
}

router.get('/foods', function(req, res, next) {
  requestPantry(res);
});

router.get('/ration', function(req, res, next) {
  requestRation(res);
});

router.post('/newFood', (req, res) => {
  const REC_DATA = req.body;
  addNewFood(res, HARDCODED_USER_ID, REC_DATA);
});

router.post('/updatePantryInfo', (req, res) => {
  const data = req.body;
  updatePantry(res, data.userId, data.updOid, data.field, data.value);
});

router.post('/updateFoodInfo', (req, res) => {
  const data = req.body;
  updateFood(res, data.updOid, data.field, data.value);
});

router.get('/test', (req, res) => {
  nutritionix.requestData("apple").then(
    data => {
      console.log(`data!!!  ${data}`);
      res.send(data);
    }, err => {
      console.log(`error!!!  ${err}`);
      res.send(err);
    }
  )
});

module.exports = router;
