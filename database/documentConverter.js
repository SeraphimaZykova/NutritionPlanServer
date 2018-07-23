exports.clientPantry = (foodObj, pantryObj, userId) => {
  let foodstuff = {};
  
  foodstuff.foodInfo = foodObj;
  foodstuff.pantryInfo = pantryObj;
  foodstuff.userInfo = {
    userId: userId
  }
  return foodstuff;
}

exports.rationPantry = (foodObj, pantryObj) => {
  let foodstuff = {};

  foodstuff.food = foodObj;
  foodstuff.available = pantryObj.available;
  foodstuff.delta = pantryObj.delta;
  foodstuff.daily = pantryObj.daily;
  
  return foodstuff;
}

exports.clientRationObj = (foodObj, pantryObj, portionSize) => {
  let ration = {};

  ration.food = foodObj;
  ration.delta = pantryObj.delta;
  ration.portion = portionSize;

  return ration;
}