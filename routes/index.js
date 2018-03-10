const
    express = require('express')
  , mongo = require('./../database/mongoManager')
  , router = express.Router()
  , HARDCODED_USER_ID = '5a4aafeae02a03d8ebf35361'
  , nutritionix = require('../api/nutritionix')
  ;

let handleError = (routerRes, code, info) => {
  console.error('Error: ' + code + ' -> ' + info);
  routerRes.sendStatus({
    status: 'fail'
    , message: 'Error: ' + code + ' -> ' + info
  });
}

let createClientPatryData = (foodObj, pantryObj, reqUserId) => {
  return new Promise((resolve, reject) => {
    if (foodObj) {
      let foodstuff = {};
      foodstuff.foodInfo = foodObj;
      foodstuff.pantryInfo = pantryObj;
      foodstuff.userInfo = {
        userId: reqUserId
      }

      resolve(foodstuff);
    }
    else {
      reject(`Unknown food id`);
    }
  });
}

let createRationPantryData = (foodObj, pantryObj) => {
  return new Promise((resolve, reject) => {
    if (foodObj) {
      let foodstuff = {};
      foodstuff.food = foodObj;
      foodstuff.available = pantryObj.available;
      foodstuff.delta = pantryObj.delta;
      foodstuff.daily = pantryObj.daily;
      
      resolve(foodstuff);
    }
    else {
      reject(`Unknown food id`);
    }
  });
}

let modifyPantryObj = (pantryObj, userId) => {
  return mongo.getFood(pantryObj.foodId)
  .then(food => {
    return createClientPatryData(food, pantryObj, userId);
  })
  .catch(err => {
    console.error(err);
    return null;
  });
}

let modifyPantryForRation = (pantryObj) => {
  return mongo.getFood(pantryObj.foodId, { 'nutrition': 1, 'glycemicIndex': 1 })
  .then(food => {
    return createRationPantryData(food, pantryObj);
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

function requestRation(response) {
  mongo.getIdealNutrition(HARDCODED_USER_ID)
  .then(nutrition => {
    nutrition.proteins = nutrition.calories * nutrition.proteins;
    nutrition.fats = nutrition.calories * nutrition.fats;
    nutrition.carbs = nutrition.calories * nutrition.carbs;

    mongo.getPantry(HARDCODED_USER_ID)
    .then(pantry => {
      Promise.all(pantry.map((fObj) => {
        return modifyPantryForRation(fObj, HARDCODED_USER_ID);
      })).then(rslv => {
        rslv = removeUndef(rslv);

        console.dir(rslv);
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
  }) 
  .catch(err => {
    console.log(`error: ${err}`);
    handleError(response, 200, err);
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
