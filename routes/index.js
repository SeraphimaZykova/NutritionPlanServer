const
    express = require('express')
  , mongoose = require('mongoose') 
  , router = express.Router()
  ;

const dbURI = 'mongodb://nutritionReader:nutritionreader@localhost:27017/NutritionPlan?authSource=admin'
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

const GAG = [
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

function getFoodsList() {
  return GAG;
}


router.get('/foods', function(req, res, next) {
  res.send(getFoodsList());
});

module.exports = router;
