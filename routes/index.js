const
    express = require('express')
  , mongo = require('./../database/mongoManager')
  , router = express.Router()
  , HARDCODED_USER_ID = '5a4aafeae02a03d8ebf35361'
  , nutritionix = require('../api/nutritionix')
  ;

let handleError = (routerRes, code, info) => {
  console.error('Error: ' + code + ' -> ' + info);
  routerRes.send(code);
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

let modifyPantryObj = (pantryObj, userId) => {
  return mongo.getFood(pantryObj.foodId)
  .then(food => {
    return createClientPatryData(food, pantryObj, userId);
  })
  .catch(err => {
    console.error(err);
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

async function requestPantry(response) {
  mongo.getPantry(HARDCODED_USER_ID)
  .then(pantry => {
    Promise.all(pantry.map((fObj) => {
      return modifyPantryObj(fObj, HARDCODED_USER_ID);
    })).then(rslv => {
      rslv = removeUndef(rslv);
      response.send(rslv);
    });
  }) 
  .catch(err => {
    console.log(`error: ${err}`);
    handleError(responce, 200, err);
  });
}

async function updatePantry(responce, userId, pantryObj) {
  mongo.updatePantry(userId, pantryObj)
  .then(result => {
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

router.post('/newFood', (req, res) => {
  const REC_DATA = req.body;
  addNewFood(res, HARDCODED_USER_ID, REC_DATA);
});

router.post('/updateUserInfo', (req, res) => {
  let REC_DATA = req.body;
  updatePantry(res, REC_DATA.userInfo.userId, REC_DATA.pantryInfo);
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
