const
    express = require('express')
  , mongo = require('./../database/mongoManager')
  , foodCollection = require('./../database/food')
  , userCollection = require('./../database/user')
  , pantry = require('./../database/pantry')
  , ration = require('./../database/ration')
  , usda = require('./../api/usda')
  , router = express.Router()
  , HARDCODED_USER_ID = '5a4aafeae02a03d8ebf35361'
  ;

  /* Server Tasks */
  /*
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

async function searchFood(response, arg, id) {
  try {
    console.log(`search ${arg}, id: ${id}`);
    let searchRes = await foodCollection.search(arg);
    let pantryObj = await pantry.get(id);

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

    response.send(searchResFix);
  }
  catch(err) {
    handleError(response, 400, err);
  }
}

router.get('/test', async function(req, res, next) {
  res.status(200).send('Hello, world!\n');
})

router.get('/foods', async function(req, res, next) {
  try {
    let userId = req.query['id'];
    res.send(await pantry.get(userId));
  } catch (err) {
    handleError(res, 400, err);
  }
});

router.get('/foodSearch', function(req, res, next) {
  try {
    let searchArg = req.query['search']
      , id = req.query['id']
      ;

    searchFood(res, searchArg, id);
  }
  catch(err) {
    handleError(res, 400, err);
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
  let id = req.query['id']
    , projection = { nutrition: 1 }
    ;

  userCollection.get(id, projection)
  .then(result => {
    res.send(result.nutrition);
  })
  .catch(err => {
    handleError(res, 400, err);
  });
});

router.post('/login', async function(req, res) {
  try {
    let err = await userCollection.insertIfNotExist(req.body.clientId);
    if (!err) {
      res.sendStatus(200);
    }
    else {
      handleError(res, 400, err);
    }
  }
  catch(error){
    handleError(res, 400, error);
  }
});

router.post('/newFood', async function(req, res) {
  const data = req.body;
  try {
    let insertedId = await foodCollection.insert(data.food);
    let pantryObj = {
      foodId: insertedId,
      delta: data.delta ? data.delta : 0,
      available: data.available ? data.available : 0,
      daily: data.daily ? data.daily : 0
    };

    await pantry.insert(data.userId, pantryObj);
    res.sendStatus(200);
  }
  catch(error) {
    handleError(res, 400, error);
  }
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
  const data = req.body
    , nutrition = data['nutrition']
    , id = data['id']
    ;
    
  if (!nutrition.calories 
      || !nutrition.proteins 
      || !nutrition.carbs 
      || !nutrition.fats) {
    handleError(res, 400, 'invalid nutrition object');
    return;
  }

  userCollection.update(id, 'nutrition', nutrition)
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
