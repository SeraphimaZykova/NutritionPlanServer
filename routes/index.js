const
    express = require('express')
  , mongo = require('./../database/mongoManager')
  , router = express.Router()
  , HARDCODED_USER_ID = '5a4aafeae02a03d8ebf35361'
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

let test1 = () => {
  console.log('test1');
  
}

setTimeout(test1, 1000);

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

router.get('/foods', function(req, res, next) {
  requestPantry(res);
});

let test = () => {
  const REC_DATA = {
    'name': 'Grape',
    'glycemicIndex': 45,
    'delta': 30,
    'available': 0,
    'daily': {
      'min': 0,
      'max': 300
    },
    'nutrition': {
      'calories': 65,
      'proteins': 0.6,
      'carbs': 16.8,
      'fats': 0.2,
    },
    'food_icon': 'content_item_grape'
  }

  // let foodstuff = new Food({
  //   name: REC_DATA.name,
  //   glycemicIndex: REC_DATA.glycemicIndex,
  //   nutrition: REC_DATA.nutrition
  // });

  // foodstuff.save(function (err, savedFoodstuff) {
  //   if (err) {
  //     //handleError(res, 200, {});
  //     console.error(err);
  //     return;
  //   }

  //   UserData.findById(HARDCODED_USER_ID, function(err, res) {
  //     res.pantry.push({
  //       foodId: savedFoodstuff.id_,
  //       delta: REC_DATA.delta,
  //       available: REC_DATA.available,
  //       daily: REC_DATA.daily
  //     });

  //     res.save(function(err, updatedRes) {
  //       if (err) {
  //         //handleError(res, 200, {});
  //         console.error(err);
  //         return;
  //       }

  //       console.log('success');
  //       console.log(updatedRes);
  //       //res.sendStatus(400);
  //     });
  //   });
  // });
}

//test();

router.post('/newFood', (req, res) => {
  const REC_DATA = req.body
    ;
  
  // let foodstuff = new Food({
  //   name: REC_DATA.name,
  //   glycemicIndex: REC_DATA.glycemicIndex,
  //   nutrition: REC_DATA.nutrition
  // });

  // foodstuff.save(function (err, savedFoodstuff) {
  //   if (err) {
  //     handleError(res, 200, {});
  //     return;
  //   }

  //   //UserData.findById()
  // });

  console.log(REC_DATA);
  res.sendStatus(400);
});

router.post('/updateUserInfo', (req, res) => {
  let REC_DATA = req.body;
  updatePantry(res, REC_DATA.userInfo.userId, REC_DATA.pantryInfo);
});

module.exports = router;
