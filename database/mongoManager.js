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

  console.log('success');
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

/* Food */
exports.getFood = (id, projection) => {
  return new Promise((rslv, rjct) => {
    foodCollection.findOne(mongodb.ObjectId(id), projection, function(err, doc) {
      if (err) {
        rjct(err);
        return;
      }

      rslv(doc);
    })
  });
}

exports.getRationFood = (id) => {
  return new Promise((rslv, rjct) => {
    foodCollection.findOne(mongodb.ObjectId(id), { nutrition: 1, glycemicIndex: 1 }, function(err, doc) {
      if (err) {
        rjct(err);
        return;
      }

      doc._id = mongodb.ObjectId(doc._id).toString();
      rslv(doc);
    })
  });
}

exports.insertFood = (foodstuff) => {
  return new Promise((rslv, rjct) => {
    foodCollection.insert(foodstuff, function(err, res) {
      if (err) {
        rjct(err.message);
        return;
      }

      if (res.insertedCount != 1) {
        rjct('not inserted');
        return;
      }

      rslv(mongodb.ObjectId(res.insertedIds[0]));
    })
  });
}

/* Pantry */
exports.getPantry = (id) => {
  return new Promise((rslv, rjct) => {
    userDataCollection.findOne(mongodb.ObjectId(id), function(err, doc) {
      if (err) {
        rjct(err);
        return;
      }

      rslv(doc.pantry);
    });
  });
}

exports.updatePantry = (userId, updOid, field, val) => {
  const foodId = new mongodb.ObjectId(updOid);
    
  let updObj = {};
  updObj['pantry.$.' + field] = val;
  
  const query = {
    "_id": mongodb.ObjectId(userId),
    "pantry.foodId": foodId
  };

  const update = {
    $set: updObj
  };

  return updateOne(userDataCollection, query, update);
}

exports.updateFood = (updOid, field, val) => {
  const foodId = new mongodb.ObjectId(updOid);
    
  let updObj = {};
  updObj[field] = val;
  
  const query = {
    "_id": mongodb.ObjectId(foodId)
  };

  const update = {
    $set: updObj
  };

  return updateOne(foodCollection, query, update);
}

exports.pushToPantry = (userId, pantryObj) => {
  return new Promise((rslv, rjct) => {
    userDataCollection.findOneAndUpdate({
      "_id": mongodb.ObjectId(userId)
    }, {
      $push: {
        "pantry": pantryObj
      }
    }, function(err, res) {
      if (err) {
        rjct(err);
        return;
      }

      if (res.lastErrorObject.updatedExisting == false) {
        rjct('Object not found to push into pantry');
        return;
      }

      rslv('success');
    })
  });
}

/* UserData */
exports.getIdealNutrition = (userId) => {
  return new Promise((rslv, rjct) => {
    userDataCollection.findOne(mongodb.ObjectId(userId), { nutrition: 1 }, function(err, doc) {
      if (err) {
        rjct(err);
        return;
      }

      rslv(doc.nutrition);
    });
  });
}

exports.setIdealNutrition = (userId, newNutrition) => {
  return new Promise((rslv, rjct) => {
    try {
      userDataCollection.updateOne({'_id': mongodb.ObjectId(userId)}, {
          $set: {
            nutrition: newNutrition
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
  })
}

exports.getUserInfo = (id, projection) => {
  return new Promise((rslv, rjct) => {
    userDataCollection.findOne(mongodb.ObjectId(id), projection, function(err, doc) {
      if (err) {
        rjct(err);
        return;
      }

      rslv(doc);
    });
  });
}