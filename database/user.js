const mongo = require('./mongoManager');
 
async function isEmailSaved(email) {
  let collection = mongo.user()
    , query = { 'credentials.email': email }
    ;

  let result = await collection.findOne(query);
  if (result) {
    return true;
  } else {
    return false;
  }
}

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
  let userDoc = { 
    'credentials': {
      'email': email,
      'password': password,
      'token': token
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
      code: 1,
      error: "user not found"
    }
  }
    
  if (result['credentials']['password'] != password) {
    return {
      code: 2,
      error: "incorrect password"
    };
  }

  let loginTime = new Date();

  let token = generate_token(32);
  upd = result;
  upd.credentials.token = token;
  upd.credentials.loginTime = loginTime;

  let updRes = await collection.updateOne(query, { $set: upd });
  if (updRes.result.ok != 1) {
    return {
      error: "failed to refresh token"
    };
  }

  return {
    token: token,
    email: email,
    loginTime: loginTime,
    prevLoginTime: result.credentials.loginTime,
    localeGMTSeconds: result.userData.localeGMTSeconds
  }
}

async function invalidateToken(email, password) {
  let collection = mongo.user()
  , query = { 'credentials.email': email }
  , upd = {}
  ;

  let result = await collection.findOne(query);
  if (!result) {
    return {
      code: 1,
      error: "user not found"
    }
  }
    
  if (result['credentials']['password'] != password) {
    return {
      code: 2,
      error: "incorrect password"
    };
  }
    
  upd = result;
  upd.credentials.token = null;
  let updRes = await collection.updateOne(query, { $set: upd });
  console.log(updRes)
  if (updRes.result.ok != 1) {
    return {
      error: "failed to invalidate token"
    };
  }

  return {}
}

async function getById(id, projection) {
  let collection = mongo.user()
    , query = { 'clientId' : id }
    , opts = { projection: projection }
    ;
  
  let res = await collection.findOne(query, opts);
  return res;
}

async function getByEmail(email, token, projection) {
  return await get({ 'credentials.email' : email, 'credentials.token': token }, projection);
}

async function get(query, projection) {
  let collection = mongo.user()
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

/**
 * 
 * @param {String} email 
 * @param {String} token 
 * @param {String} field 
 * @param {Any} value 
 */
function update(email, token, field, value) {
  let query = { 'credentials.email': email, 'credentials.token': token }
    , upd = {}
    ;

  upd[field] = value;

  console.log('upd', query, ' / with ', upd)
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

/**
 * 
 * @param {'ObjectId'} id 
 * @param {[Object]} set key-value pairs for $set
 * @param {[String]} unset keys for $unset
 */
async function updateById(id, set, unset) {
  let query = { '_id': id };
  let res;

  if (unset.length == 0) {
    res = await mongo.user().updateOne(query, { $set: set });
  } else {
    let unsetQuery = {};
    unset.forEach(key => {
      unsetQuery[key] = 1;
    })
  
    res = await mongo.user().updateOne(query, { $set: set, $unset: unsetQuery });
  }

  return res.result.nModified == 1;
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
exports.getById = getById;
exports.getByEmail = getByEmail;
exports.insertIfNotExist = insertIfNotExist;
exports.update = update;
exports.updateById = updateById;
exports.register = register;
exports.login = login;
exports.isEmailSaved = isEmailSaved;
exports.invalidateToken = invalidateToken;