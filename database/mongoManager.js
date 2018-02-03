const 
    mongodb = require('mongodb')
    mongo = mongodb.MongoClient
  , url = 'mongodb://nutritionUser:nutritionuser@localhost:27017/NutritionPlan?authSource=NutritionPlan'
  ;

let
    client
  , db
  , foodCollection
  , userDataCollection
  ;

mongo.connect(url, function(err, connectedClient) {
  if (err) {
    console.error(err);
    process.exit(0);
    return;
  }

  client = connectedClient;
  db = client.db('NutritionPlan');
  foodCollection = db.collection('Food');
  userDataCollection = db.collection('UserData');

  console.log('success');
});

process.on('SIGINT', function() {
  client.close(() => {
    process.exit(0);
  });
});

//TODO: check collecitions initialized
      if (err) {
        console.error(err);
        return;
      }

      console.log('closed');
      process.exit(0);
    }); 
  }); 
});
