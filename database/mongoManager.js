const 
    MongoClient = require('mongodb').MongoClient
  , co = require('co')
  , url = 'mongodb://nutritionUser:nutritionuser@localhost:27017/NutritionPlan?authSource=NutritionPlan'
  ;

let db;

MongoClient.connect(url, function(err, res) {
  if (err) {
    console.error(err);
    return;
  }

  console.log('Database connected successful');
  db = res;

  process.on('SIGINT', () => { 
    console.log('\nclosing');
    db.close(function(err, res) {
      if (err) {
        console.error(err);
        return;
      }

      console.log('closed');
      process.exit(0);
    }); 
  }); 
});
