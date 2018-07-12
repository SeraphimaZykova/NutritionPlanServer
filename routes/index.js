const
    express = require('express')
  , mongo = require('./../database/mongoManager')
  , foodCollection = require('./../database/food')
  , userCollection = require('./../database/user')
  , pantry = require('./../database/pantry')
  , ration = require('./../database/ration')
  , usda = require('./../api/usda')
  , router = express.Router()
  ;

let handleError = (routerRes, code, info) => {
  console.error('Error: ' + code + ' -> ' + info);
  routerRes.status(code).send('Error: ' + code + ' -> ' + info);
}

async function search(arg) {
  let result = await usda.search(arg);
  return result;
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
});

router.get('/search', async function(req, res, next) {
  try {
    let args = req.query['args'];
    if (!args) {
      handleError(res, 400, 'no search args');
      return;
    }

    let result = await search(args);
    res.status(200).send(result);
  }
  catch(err) {
    handleError(res, 400, err);
  }
});

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
    let id = req.query['id'];
    let result = await ration.get(id);
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

    console.log(`add to pantry: ${data.foodId}, from user ${data.userId}`);
    await pantry.insert(data.userId, pantryObj)
    res.sendStatus(200);
  } catch (error) {
    handleError(res, 400, error);
  }
});

router.post('/removeFromPantry', async (req, res) => {
  const data = req.body;
  try {
    console.log(`remove from pantry: ${data.foodId}, from user ${data.userId}`);

    await pantry.remove(data.userId, data.foodId);
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
    await ration.update(data.userId, data.id, 'portion', data.portion);
    res.sendStatus(200);
  }
  catch(err) {
    handleError(res, 400, err);
  }
});

router.post('/addToRation', async (req, res) => {
  const data = req.body;
  try {
    await ration.add(data.userId, data.food);
    res.sendStatus(200);
  }
  catch(err) {
    handleError(res, 400, err);
  }
});

module.exports = router;
