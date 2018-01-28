const
    express = require('express')
  , mongo = require('./../database/mongoManager')
  , router = express.Router()
  ;

async function makeDbRequest(response) {
  // let query = UserData.findById(HARDCODED_USER_ID);

  // query.then((res) => {
  //   let fullUserfoodArray = []
  //     ;

  //   Promise.all(res.pantry.map((fObj) => {
  //     return Food.findById(fObj.foodId).then(
  //       rslv => {
  //         return new Promise((resolve, reject) => {
  //           let nFdObj = {}
  //             ;
  //           nFdObj.mInfo = rslv;
  //           nFdObj.uInfo = fObj;

  //           resolve(nFdObj);
  //         });
  //       }
  //     );
  //   })).then(
  //     rslv => {
  //       response.send(rslv);
  //     }
  //   )
  // });
}

//dbInit();

let handleError = (routerRes, code, info) => {
  console.error('Error: ' + code + ' -> ' + info);
  routerRes.send(code);
}

router.get('/test', (req, res, next) => {
  makeDbRequest(res);
})


router.get('/foods', function(req, res, next) {
  makeDbRequest(res);
  //res.send(getFoodsList());
});

let test = () => {
  const REC_DATA = {
    'name': 'Grape',
    'glycemicIndex': 45,
    'delta': 30,
    'available': 0,
    'daily': {
      'min': 0,
      'max': 100
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
  let REC_DATA = req.body
    ;

  // UserData.findById(HARDCODED_USER_ID, function(err, doc) {
  //   if (err) {
  //     handleError(res, 200, {});
  //     return;
  //   }

  //   doc.pantry.some(element => {
  //     if (element.foodId == REC_DATA.uInfo.foodId) {
  //       element.set({
  //         delta: REC_DATA.uInfo.delta,
  //         available: REC_DATA.uInfo.available,
  //         daily: REC_DATA.uInfo.daily
  //       });

  //       doc.save(function(err, updatedRes) {
  //         if (err) {
  //           handleError(res, 200, {});
  //           return;
  //         }

  //         res.sendStatus(400);
  //       });

  //       return true;
  //     }

  //     return false;
  //   });
  // });
});

module.exports = router;
