require('dotenv').config();

const 
    mongodb = require('mongodb')
    mongo = mongodb.MongoClient
  ;

let
    client
  , db
  , foodCollection
  , userDataCollection
  , pantryCollection
  ;

mongo.connect(process.env.DATABASE, function(err, connectedClient) {
  if (err) {
    console.error(err);
    process.exit(0);
    return;
  }

  client = connectedClient;
  db = client.db(process.env.DATABASE_NAME);
  foodCollection = db.collection('Food');
  userDataCollection = db.collection('UserData');
  pantryCollection = db.collection('Pantry');

  console.log('database connection success');
});

process.on('SIGINT', function() {
  client.close(() => {
    process.exit(0);
  });
});

exports.food = () => {
  return foodCollection;
};

exports.user = () => {
  return userDataCollection;
}

exports.pantry = () => {
  return pantryCollection;
}