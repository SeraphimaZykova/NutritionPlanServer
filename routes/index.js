const
    express = require('express')
  , mongoose = require('mongoose') 
  , router = express.Router()
  , FoodSchema = mongoose.Schema(
    {
      name: String,
      glycemicIndex: Number,
      nutrition: Object
    })
  , PantrySchema = mongoose.Schema( 
    {
      foodId: mongoose.Schema.Types.ObjectId,
      delta: Number,
      available: Number,
      daily: {
        min: Number,
        max: Number
      }
    })
  , UserDataSchema = mongoose.Schema(
    {
      pantry: [PantrySchema]
    })
  , Food = mongoose.model('Food', FoodSchema)
  , UserData = mongoose.model('UserData', UserDataSchema)
  , HARDCODED_USER_ID = "5a4aafeae02a03d8ebf35361"
  , GAG = [
    {
      'name': 'Avocado',
      'delta': 10,
      'kkal': 160,
      'proteins': 2,
      'carbs': 4.4,
      'fats': 14.7,
      'food_icon': 'content_item_avocado'
    },
    {
      'name': 'Parmezan cheese',
      'delta': 10,
      'kkal': 431,
      'proteins': 38,
      'carbs': 4.1,
      'fats': 29,
      'food_icon': 'content_item_cheese'
    },
    {
      'name': 'Grape',
      'delta': 30,
      'kkal': 65,
      'proteins': 0.6,
      'carbs': 16.8,
      'fats': 0.2,
      'food_icon': 'content_item_grape'
    },
    {
      'name': 'Chicken',
      'delta': 100,
      'kkal': 170,
      'proteins': 16,
      'carbs': 0,
      'fats': 14,
      'food_icon': 'content_item_chiken'
    },
    ];
  ;

function dbInit() {
  const dbURI = 'mongodb://nutritionUser:nutritionuser@localhost:27017/NutritionPlan?authSource=NutritionPlan'
  mongoose.connect(dbURI);

  mongoose.connection.on('connected', function () {  
    console.log('Mongoose default connection open to ' + dbURI);
  }); 

  mongoose.connection.on('error',function (err) {  
    console.log('Mongoose default connection error: ' + err);
  }); 

  mongoose.connection.on('disconnected', function () {  
    console.log('Mongoose default connection disconnected'); 
  });

  // If the Node process ends, close the Mongoose connection 
  process.on('SIGINT', function() {  
    mongoose.connection.close(function () { 
      console.log('Mongoose default connection disconnected through app termination'); 
      process.exit(0); 
    }); 
  }); 
}

async function makeDbRequest(response) {
  let query = UserData.findById(HARDCODED_USER_ID);

  query.then((res) => {
    let fullUserfoodArray = []
      ;

    Promise.all(res.pantry.map((fObj) => {
      return Food.findById(fObj.foodId).then(
        rslv => {
          return new Promise((resolve, reject) => {
            let nFdObj = {}
              ;
            nFdObj.mInfo = rslv;
            nFdObj.uInfo = fObj;

            resolve(nFdObj);
          });
        }
      );
    })).then(
      rslv => {
        response.send(rslv);
      }
    )
  });
}

dbInit();

let handleError = (routerRes, code, info) => {
  console.error('Error: ' + code + ' -> ' + info);
  routerRes.send(code);
}

function getFoodsList() {
  return GAG;
}

router.get('/test', (req, res, next) => {
  makeDbRequest(res);
})


router.get('/foods', function(req, res, next) {
  makeDbRequest(res);
  //res.send(getFoodsList());
});

router.post('/updateUserInfo', (req, res) => {
  let REC_DATA = req.body
    ;

  UserData.findById(HARDCODED_USER_ID, function(err, doc) {
    if (err) {
      handleError(res, 200);
      return;
    }

    doc.pantry.some(element => {
      if (element.foodId == REC_DATA.uInfo.foodId) {
        element.set({
          delta: REC_DATA.uInfo.delta,
          available: REC_DATA.uInfo.available,
          daily: REC_DATA.uInfo.daily
        });

        doc.save(function(err, updatedRes) {
          if (err) {
            handleError(res, 200);
            return;
          }

          res.sendStatus(400);
        });

        return true;
      }

      return false;
    });
  });
});

module.exports = router;
