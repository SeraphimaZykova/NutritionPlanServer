const
    express = require('express')
  , mongo = require('./../database/mongoManager')
  , foodCollection = require('./../database/food')
  , userCollection = require('./../database/user')
  , pantry = require('./../database/pantry')
  , ration = require('./../database/ration')
  , router = express.Router()
  , HARDCODED_USER_ID = '5a4aafeae02a03d8ebf35361'
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

router.get('/foods', async function(req, res, next) {
  try {
    let clientData = {
      userId: HARDCODED_USER_ID,
      pantry: await pantry.get(HARDCODED_USER_ID)
    };

    res.send(clientData);
  } catch (err) {
    handleError(res, 400, err);
  }
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

router.get('/ration', async function(req, res, next) {
  try {
    let result = await ration.get(HARDCODED_USER_ID);
    res.send(result);
  } catch (err) {
    handleError(res, 400, err);
  }
});

router.get('/idealNutrition', function(req, res, next) {
  let projection = { nutrition: 1 };
  userCollection.get(HARDCODED_USER_ID, projection)
  .then(result => {
    res.send(result.nutrition);
  })
  .catch(err => {
    handleError(res, 400, err);
  });
});

router.post('/newFood', (req, res) => {
  const REC_DATA = req.body;
  addNewFood(res, HARDCODED_USER_ID, REC_DATA);
});

router.post('/updatePantryInfo', async (req, res) => {
  const data = req.body;
  try {
    await pantry.update(data.userId, data.updOid, data.field, data.value);
    res.sendStatus(200);
  }
  catch(err) {
    handleError(res, 400, err);
  }
});

router.post('/addToPantry', async (req, res) => {
  const data = req.body;
  try {
    let pantryObj = {
      foodId: data.foodId,
      available: 0,
      delta: 0,
      daily: {
        min: 0
      }
    };

    await pantry.insert(data.userId, pantryObj)
    res.sendStatus(200);
  } catch (error) {
    handleError(res, 400, error);
  }
});

router.post('/removeFromPantry', async (req, res) => {
  const data = req.body;
  try {
    await pantry.remove(userId, foodId);
    res.sendStatus(200);
  }
  catch(err) {
    handleError(res, 400, err);
  }
});

router.post('/updateFoodInfo', (req, res) => {
  const data = req.body;
  
  foodCollection.update(data.updOid, data.field, data.val)
  .then(result => {
    res.send(result);
  })
  .catch(err => {
    handleError(res, 400, err);
  });
});

router.post('/updateIdealNutrition', (req, res) => {
  const data = req.body;
  if (!data.calories 
      || !data.proteins 
      || !data.carbs 
      || !data.fats) {
    handleError(res, 400, 'invalid nutrition object');
    return;
  }

  userCollection.update(HARDCODED_USER_ID, 'nutrition', data)
  .then(result => {
    res.sendStatus(200);
  })
  .catch(err => {
    handleError(res, 400, err);
  });
});

router.post('/updateRation', async (req, res) => {
  const data = req.body;
  try {
    await ration.update(HARDCODED_USER_ID, data.id
      , 'portion', data.portion);
    res.sendStatus(200);
  }
  catch(err) {
    handleError(res, 400, err);
  }
});

router.post('/addToRation', async (req, res) => {
  const data = req.body;
  try {
    await ration.add(HARDCODED_USER_ID, data);
    res.sendStatus(200);
  }
  catch(err) {
    handleError(res, 400, err);
  }
});

module.exports = router;
