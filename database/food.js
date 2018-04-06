const 
    mongodb = require('mongodb')
  , mongo = require('./mongoManager')
  ;
 
let get = (id, projection) => {
  let query = mongodb.ObjectId(id)
    , opts = { projection: projection };
  
  return new Promise((rslv, rjct) => {
    let collection = mongo.food();
    let callback = (err, res) => {
      if (err) {
        rjct(err);
        return;
      }
  
      res['id'] = res['_id'].toString();
      rslv(res);
    };

    collection.findOne(query, opts, callback);
  });
}

let insert = (obj) => {
  return new Promise((rslv, rjct) => {
    let collection = mongo.food();
    collection.insert(obj, function(err, res) {
      if (err) {
        rjct(err);
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

let search = (query) => {
  return new Promise((rslv, rjct) => {
    try {
      let regexp = new RegExp(query);
      let collection = mongo.food();
      collection.find({ name: { $regex: regexp, $options: 'i' } }).toArray()
      .then(res => {
        let fix = res.map(obj => {
          let newObj = obj;
          newObj['id'] = obj['_id'].toString();
          return newObj;
        });

        rslv(fix);
      })
      .catch(err => {
        rjct(err);
      });
    }
    catch(err) {
      rjct(err);
    }
  });
}

exports.get = get;
exports.insert = insert;
exports.search = search;
