const
    mongo = require('./database/mongoManager')
  , HARDCODED_USER_ID = '5a4aafeae02a03d8ebf35361'
  , ration = require('ration_calculator')
  , converter = require('./routes/documentConverter')
  ;


let modifyPantryForRation = (pantryObj) => {
  return mongo.getRationFood(pantryObj.foodId)
  .then(food => {
    return converter.rationPantry(food, pantryObj);
  })
  .catch(err => {
    console.error(err);
    return null;
  });
}
   
let updPantry = (pantry) => {
  return Promise.all(pantry.map((pantryObj) => {
    return modifyPantryForRation(pantryObj, HARDCODED_USER_ID);
  }));
}

let getPantryObj = (pantry, id) => {
  for (let i = 0; i < pantry.length; i++) {
    if (pantry[i].food._id == id) {
      return pantry[i];
    }
  }
}

function requestRation() {
  let projection = { nutrition: 1 };
  mongo.getUserInfo(HARDCODED_USER_ID, projection)
  .then(res => {
    const idealNutrition = {
      calories: {
        total: res.nutrition.calories
      },
      proteins: res.nutrition.calories * res.nutrition.proteins,
      carbs: {
        total: res.nutrition.calories * res.nutrition.carbs
      },
      fats: {
        total: res.nutrition.calories * res.nutrition.fats
      }
    };

    updPantry(res.pantry)
    .then(modifiedPantry => {
      ration.calculateRation(idealNutrition, modifiedPantry)
      .then(rationResult => {
        rationResult.ration.forEach(element => {
          let pObj = getPantryObj(modifiedPantry, element.food);
          
          element.food = pObj.food;
          element.available = pObj.available;
          element.delta = pObj.delta;
          element.daily = pObj.daily;
        });
      })
      .catch(err => {
        console.error(err);
      })
    })
    .catch(err => {
      console.error(err);
    })
  })
  .catch(err => {
    //handleError(response, 200, err);
    console.error(err);
    return;
  });

  // mongo.getIdealNutrition(HARDCODED_USER_ID)
  // .then(nutrition => {
  //   mongo.getPantry(HARDCODED_USER_ID)
  //     .then(pantry => {
  //       return Promise.all(pantry.map((fObj) => {
  //         return modifyPantryForRation(fObj, HARDCODED_USER_ID);
  //       }))
  //     })
  //     .then(rationFoods => {
  //       rationFoods = removeUndef(rationFoods);
  //       return ration.calculateRation(idealNutrition, rationFoods);
  //     })
  //     .then(rationRes => {
  //       return Promise.all(rationRes.ration.map((rationObj) => {
  //         let portionSize = rationObj.size;

  //         return mongo.getFood(rationObj.food).then(foodDesc => {
  //             rationObj.food = foodDesc;
  //           });
  //       }))
  //       .then(foodDescs => {
  //         response.send(rationRes);
  //       })
  //     })
  //     .catch(err => {
  //       console.log(err);
  //       handleError(response, 200, err);
  //     })
  // })
  // .catch(err => {
  //   console.error(`get ideal nutrition error: ${err}`);
  //   handleError(response, 200, err);
  //   return;
  // });
}

setTimeout(() => {
  requestRation();
}, 500);
