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
  db = client.db('NutritionPlan');
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

const updateOne = (collection, query, update) => {
  return new Promise((rslv, rjct) => {
    collection.findOneAndUpdate(query, update, function(err, res) {
      if (err) {
        rjct(err);
        return;
      }

      if (res.lastErrorObject.updatedExisting == false) {
        rjct('Object not found');
        return;
      }

      rslv('success');
    });
  }).catch(err => {
    console.log(`update collection ${collection} error: ${err}`);
  });
}

//TODO: check collecitions initialized
//TODO: projection not working

/* Ration */
exports.setRation = (userId, rationObj) => {
  return new Promise((rslv, rjct) => {
    try {
      userDataCollection.updateOne(
        {
          '_id': mongodb.ObjectId(userId)
        }, {
          $set: {
            ration: rationObj
          }
        }, function(err, res) {
          if (err) {
            rjct(err);
            return;
          }
  
          rslv(res);
        }
      );
    }
    catch(err) {
      rjct(err);
    }
  });
}

exports.updateRation = (userId, foodIdStr, portion) => {
  const query = {
    "_id": mongodb.ObjectId(userId),
    "ration.food": foodIdStr
  }
  , update = {
    $set: {
      'ration.$.portion': portion
    }
  };

  return updateOne(userDataCollection, query, update);
}

exports.addToRation = (userId, rationObj) => {
  const query = {
    "_id": mongodb.ObjectId(userId),
  }
  , update = {
    $push: {
      'ration': rationObj
    }
  };

  return updateOne(userDataCollection, query, update); 
}

exports.food = () => {
  return foodCollection;
};

exports.user = () => {
  return userDataCollection;
}

exports.pantry = () => {
  return pantryCollection;
}