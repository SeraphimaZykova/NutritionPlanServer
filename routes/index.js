const
    express = require('express')
  , mongo = require('./../database/mongoManager')
  , foodCollection = require('./../database/food')
  , userCollection = require('./../database/user')
  , pantry = require('./../database/pantry')
  , router = express.Router()
  , HARDCODED_USER_ID = '5a4aafeae02a03d8ebf35361'
  , nutritionix = require('../api/nutritionix')
  , ration = require('ration_calculator')
  , converter = require('./documentConverter')
  ;

  /* Server Tasks */
  /*
  * 1. Login. 
  *   add credentials to User collection. authorization mechanism.
  * 
  * 4. 
  *   -- сохранение сгенерированного рациона в бд. 
  *   -- при запросе с клиента сначала проверять бд, 
  *   -- если ничего нет или были изменения списка продуктов / настроек - запускать генерацию.
  *   в запросе с клиента должна присутсвовать дата 
  *   (можно генерировать заранее + просмотр предыдущих дней)
  * 
  *  => хранить дату генерации / изменения рациона 
  *                  последнего изменения pantry
  *                  изменения ideal nutrition
  * 
  */

let handleError = (routerRes, code, info) => {
  console.error('Error: ' + code + ' -> ' + info);
  routerRes.send({
    status: code, 
    message: 'Error: ' + code + ' -> ' + info
  });
}

let srvErrHdl = err => {
  console.error(err);
  return null;
}

let modifyPantryObj = async (pantryObj, userId) => {
  try {
    let food = await foodCollection.get(pantryObj.foodId);
    return converter.clientPantry(food, pantryObj, userId);
  } catch (err) {
    return srvErrHdl(err);
  }
}

let modifyPantryForRation = async (pantryObj) => {
  try {
    let projection = { nutrition: 1, glycemicIndex: 1 };
    let food = await foodCollection.get(pantryObj.foodId, projection);
    return converter.rationPantry(food, pantryObj);
  } catch (err) {
    return srvErrHdl(err);
  }
}

// отрефакторить в чистую функцию
let modifyRationForClient = (ration, pantry, idealNutrition) => {
  let modified = ration.map(element => {
    let pObj = getPantryObj(pantry, element.food);
    
    let newEl = element;
    newEl.food = pObj.food;
    newEl.available = pObj.available;
    newEl.daily = pObj.daily;

    return newEl;
  });

  return {
    idealNutrition: idealNutrition,
    ration: modified
  }
}

let removeUndef = (array) => {
  return array.filter(e => e !== undefined);
}

async function requestPantry(response) {
  try {
    let pantryArray = await pantry.get(HARDCODED_USER_ID);
    Promise.all(pantryArray.map((fObj) => {
      return modifyPantryObj(fObj, HARDCODED_USER_ID);
    }))
    .then(rslv => {
      rslv = removeUndef(rslv);
      response.send(rslv);
    })
  } catch (err) {
    console.log(`error: ${err}`);
    handleError(response, 400, err);
  }
}
  
let updPantry = (pantry) => {
  return Promise.all(pantry.map((pantryObj) => {
    return modifyPantryForRation(pantryObj, HARDCODED_USER_ID);
  }));
}

let getPantryObj = (pantry, id) => {
  return pantry.find(e => e.food['_id'] === id);
}

async function requestRation(response) {
  try {
    let projection = { nutrition: 1, ration: 1, pantry: 1, _upd: 1 }
      , res = await userCollection.get(HARDCODED_USER_ID, projection)
      , idealNutrition = {
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
        }
      , modifiedPantry = await updPantry(res.pantry);
      ; 
    
    if (res.ration) {
      let clientData = modifyRationForClient(res.ration, modifiedPantry, idealNutrition);
      response.send(clientData);
      return;
    } else {
      let rationResult = await ration.calculateRation(idealNutrition, modifiedPantry);

      mongo.setRation(HARDCODED_USER_ID, rationResult.ration)
      .catch(err => {
        console.log('Failed to update ration');
        console.error(err);
      });

      let clientData = modifyRationForClient(rationResult.ration, modifiedPantry, idealNutrition);
      response.send(clientData);
    }
  } catch (err) {
    handleError(response, 400, err);
  }
}

function requestIdealNutrition(response) {
  let projection = { nutrition: 1 };
  mongo.getUserInfo(HARDCODED_USER_ID, projection)
  .then(res => {
    response.send(res.nutrition);
  })
  .catch(err => {
    handleError(response, 400, err);
  });
}

function updateIdealNutrition(response, nutrition) {
  mongo.setIdealNutrition(HARDCODED_USER_ID, nutrition)
  .then(res => {
    response.sendStatus(200);
  })
  .catch(err => {
    handleError(response, 400, err);
  });
}

async function updatePantry(response, userId, updOid, field, val) {
  try {
    await pantry.update(userId, updOid, field, val);
    response.sendStatus(200);
  }
  catch(err) {
    handleError(response, 400, err);
  }
}

function addToPantry(response, userId, foodId) {
  let pantryObj = {
    foodId: foodId,
    available: 0,
    delta: 0,
    daily: {
      min: 0
    }
  };

  mongo.addToPantry(userId, pantryObj)
  .then(result => {
    response.sendStatus(200);
  })
  .catch(err => {
    handleError(response, 400, err);
  });
}

function removeFromPantry(response, userId, foodId) {
  mongo.removeFromPantry(userId, foodId)
  .then(result => {
    response.sendStatus(200);
  })
  .catch(err => {
    handleError(response, 400, err);
  });
}

async function updateRation(response, userId, foodId, portion) {
  mongo.updateRation(userId, foodId, portion)
  .then(result => {
    response.sendStatus(200);
  })
  .catch(err => {
    handleError(response, 400, err);
  });
}

async function addToRation(response, userId, rationObj) {
  mongo.addToRation(userId, rationObj)
  .then(result => {
    response.sendStatus(200);
  })
  .catch(err => {
    handleError(response, 400, err);
  });
}

function addNewFood(response, userId, data) {
  let foodstuff = {
    name: data.foodInfo.name,
    glycemicIndex: data.foodInfo.glycemicIndex,
    nutrition: data.foodInfo.nutrition
  };
  
  foodCollection.insert(foodstuff)
  .then(insertedOId => {
    let pantryObj = {
      foodId: insertedOId,
      delta: data.pantryInfo.delta,
      available: data.pantryInfo.available,
      daily: data.pantryInfo.daily
    };
    return mongo.pushToPantry(userId, pantryObj);
  })
  .then(res => {
    response.sendStatus(200);
  })
  .catch(err => {
    handleError(response, 400, err);
  });
}

async function searchFood(response, arg) {
  try {
    console.log(`search ${arg}`);
    let searchRes = await foodCollection.search(arg);
    let pantryObj = await pantry.get(HARDCODED_USER_ID);

    let searchResFix = searchRes.map(element => {

      function isIdEqual(pElement) {
        if (pElement.foodId === element.id) {
          return true;
        }
        return false;
      }

      if (pantryObj.some(isIdEqual)) {
        element.contains = true;
      }
      else {
        element.contains = false;
      }

      return element;
    });

    let data = {
      userInfo: {
        userId: HARDCODED_USER_ID
      },
      foods: searchResFix
    };
    response.send(data);
  }
  catch(err) {
    handleError(response, 400, err);
  }
}

router.get('/foods', function(req, res, next) {
  requestPantry(res);
});

router.get('/foodSearch', function(req, res, next) {
  let queryKeys = Object.keys(req.query);
  if(queryKeys.length > 0) {
    searchFood(res, queryKeys[0]);
  }
  else {
    handleError(res, 400, 'invalid query');
  }
})

router.get('/ration', function(req, res, next) {
  requestRation(res);
});

router.get('/idealNutrition', function(req, res, next) {
  requestIdealNutrition(res);
});

router.post('/newFood', (req, res) => {
  const REC_DATA = req.body;
  addNewFood(res, HARDCODED_USER_ID, REC_DATA);
});

router.post('/updatePantryInfo', (req, res) => {
  const data = req.body;
  updatePantry(res, data.userId, data.updOid, data.field, data.value);
});

router.post('/addToPantry', (req, res) => {
  const data = req.body;
  addToPantry(res, data.userId, data.foodId);
});

router.post('/removeFromPantry', (req, res) => {
  const data = req.body;
  removeFromPantry(res, data.userId, data.foodId);
});

router.post('/updateFoodInfo', (req, res) => {
  const data = req.body;
  
  foodCollection.update(data.updOid, data.field, data.val)
  .then(result => {
    console.log(result);
    response.send(result);
  })
  .catch(err => {
    handleError(response, 400, err);
  });
});

router.post('/updateIdealNutrition', (req, res) => {
  const data = req.body;
  updateIdealNutrition(res, data);
});

router.post('/updateRation', (req, res) => {
  const data = req.body;
  updateRation(res, HARDCODED_USER_ID, data.id, data.portion);
});

router.post('/addToRation', (req, res) => {
  const data = req.body;
  addToRation(res, HARDCODED_USER_ID, data);
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
