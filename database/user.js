const 
    mongodb = require('mongodb')
  , mongo = require('./mongoManager')
  , pantry = require('./pantry')
  ;
 
async function register(email, password) {
  let collection = mongo.user()
    , query = { 'credentials.email': email }
    ;
  
  let result = await collection.findOne(query);
  if (result) {
    return {
      error: "email already registered"
    };
  }

  let token = generate_token(32);
  let pantryId = await pantry.create();
  let userDoc = { 
    'credentials': {
      'email': email,
      'password': password,
      'token': token
    },
    'pantry': pantryId,
    'nutrition': {
      calories: 0,
      proteins: 0,
      carbs: 0,
      fats: 0
    } 
  };

  let insertRes = await collection.insertOne(userDoc);
  if (insertRes.result.ok != 1) {
    return {
      error: "insert failed"
    };
  }

  return {
    token: token,
    email: email
  };
}

async function login(email, password) {
  let collection = mongo.user()
  , query = { 'credentials.email': email }
  , upd = {}
  ;

  let result = await collection.findOne(query);
  if (!result) {
    return {
      error: "user not found"
    }
  }
    
  if (result['credentials']['password'] != password) {
    return {
      error: "incorrect password"
    };
  }
    
  let token = generate_token(32);
  upd = result;
  upd.credentials.token = token;
  let updRes = await collection.updateOne(query, { $set: upd });
  console.log(updRes)
  if (updRes.result.ok != 1) {
    return {
      error: "failed to refresh token"
    };
  }

  return {
    token: token,
    email: email
  }
}

async function get(id, projection) {
  let collection = mongo.user()
    , query = { 'clientId' : id }
    , opts = { projection: projection }
    ;
  
  let res = await collection.findOne(query, opts);
  return res;
}

async function get(email, token, projection) {
  let collection = mongo.user()
    , query = { 'credentials.email' : email, 'credentials.token': token }
    , opts = { projection: projection }
    ;
  
  let res = await collection.findOne(query, opts);
  return res;
}


async function insertIfNotExist(clientId) {
  let collection = mongo.user()
    , query = { 'clientId': clientId }
    ;
  
  let result = await collection.findOne(query);
  if (result)
    return null;

  let pantryId = await pantry.create();
  let userDoc = { 
    'clientId': clientId,
    'pantry': pantryId,
    'nutrition': {
      calories: 0,
      proteins: 0,
      carbs: 0,
      fats: 0
    } 
  };

  let insertRes = await collection.insert(userDoc);
  if (insertRes.result.ok == 1) {
    return null;
  }

  return insertRes;
}

function update(id, field, value) {
  let query = { 'clientId': id }
    , upd = {}
    ;

  upd[field] = value;
  return new Promise((rslv, rjct) => {
    let collection = mongo.user();
    let callback = (err, res) => {
      if (err) {
        rjct(err);
        return;
      }
      rslv(res);
    };

    collection.updateOne(query, { $set: upd }, callback);
  });
}

function generate_token(length){
  //edit the token allowed characters
  var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
  var b = [];  
  for (var i=0; i<length; i++) {
      var j = (Math.random() * (a.length-1)).toFixed(0);
      b[i] = a[j];
  }
  return b.join("");
}

exports.get = get;
exports.insertIfNotExist = insertIfNotExist;
exports.update = update;
exports.register = register;
exports.login = login;