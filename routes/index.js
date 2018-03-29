const
    express = require('express')
  , mongo = require('./../database/mongoManager')
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
  *  -- 2. добавленме нового продукта в бд.
  * 
  * 3. взаимодействие в nutritionix api
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
  * 5. -- изменение рациона с клиента 
  *   изменение рациона с текущей/будущей датой.
  * 
  * 6. запрос списка сгенерированных дней (даты + сумма калорий за день)
  * 
  * 7. запрос на генерацию N дней вперед (начиная с сегодняшнего, даже если они есть)
  * 
  * -- 8. изменение настроек:
  *     - ideal nutrition
  */

let handleError = (routerRes, code, info) => {
  console.error('Error: ' + code + ' -> ' + info);
  routerRes.json({
    status: 'fail'
    , message: 'Error: ' + code + ' -> ' + info
  });
}

let srvErrHdl = err => {
  console.error(err);
  return null;
}

let modifyPantryObj = async (pantryObj, userId) => {
  try {
    let food = await mongo.getFood(pantryObj.foodId);
    return converter.clientPantry(food, pantryObj, userId);
  } catch (err) {
    return srvErrHdl(err);
  }
}

let modifyPantryForRation = async (pantryObj) => {
  try {
    let food = await mongo.getRationFood(pantryObj.foodId);
    return converter.rationPantry(food, pantryObj);
  } catch (err) {
    return srvErrHdl(err);
  }
}

// отрефакторить в чистую функцию
let modifyRationForClient = (ration, pantry, idealNutrition) => {
  ration.forEach(element => {
    let pObj = getPantryObj(pantry, element.food);
    
    element.food = pObj.food;
    element.available = pObj.available;
    element.daily = pObj.daily;
  });

  return {
    idealNutrition: idealNutrition,
    ration: ration
  }
}

let removeUndef = (array) => {
  return array.filter(e => e !== undefined);
}

async function requestPantry(response) {
  try {
    let pantry = await mongo.getPantry(HARDCODED_USER_ID);
    Promise.all(pantry.map((fObj) => {
      return modifyPantryObj(fObj, HARDCODED_USER_ID);
    }))
    .then(rslv => {
      rslv = removeUndef(rslv);
      response.send(rslv);
    })
  } catch (err) {
    console.log(`error: ${err}`);
    handleError(response, 200, err);
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
    let projection = { nutrition: 1, ration: 1 }
      , res = await mongo.getUserInfo(HARDCODED_USER_ID, projection)
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
    console.error(err);
    handleError(response, 200, err);
  }
}

function requestIdealNutrition(response) {
  let projection = { nutrition: 1 };
  mongo.getUserInfo(HARDCODED_USER_ID, projection)
  .then(res => {
    response.send(res.nutrition);
  })
  .catch(err => {
    handleError(response, 200, err);
    console.error(err);
  });
}

function updateIdealNutrition(response, nutrition) {
  mongo.setIdealNutrition(HARDCODED_USER_ID, nutrition)
  .then(res => {
    response.sendStatus(400);
  })
  .catch(err => {
    handleError(response, 200, err);
    console.error(err);
  });
}

function updatePantry(responce, userId, updOid, field, val) {
  mongo.updatePantry(userId, updOid, field, val)
  .then(result => {
    responce.send(result);
  })
  .catch(err => {
    console.log(err);
    handleError(responce, 200, err);
  });
}

async function updateRation(response, userId, foodId, portion) {
  mongo.updateRation(userId, foodId, portion)
  .then(result => {
    response.sendStatus(400);
  })
  .catch(err => {
    console.error(err);
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


function addNewFood(responce, userId, data) {
  let foodstuff = {
    name: data.foodInfo.name,
    glycemicIndex: data.foodInfo.glycemicIndex,
    nutrition: data.foodInfo.nutrition
  };
  
  mongo.insertFood(foodstuff)
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
    responce.sendStatus(400);
  })
  .catch(err => {
    console.error(err);
    handleError(responce, 200, err);
  });
}

router.get('/foods', function(req, res, next) {
  requestPantry(res);
});

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

router.post('/updateFoodInfo', (req, res) => {
  const data = req.body;
  updateFood(res, data.updOid, data.field, data.value);
});

router.post('/updateIdealNutrition', (req, res) => {
  const data = req.body;
  updateIdealNutrition(res, data);
});

router.post('/updateRation', (req, res) => {
  const data = req.body;
  updateRation(res, HARDCODED_USER_ID, data.id, data.portion);
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
