const NutritionFacts = require('nutrition-facts')
const NF = new NutritionFacts.default(process.env.USDA_NDB_API_KEY);
  
/* https://ndb.nal.usda.gov/ndb/doc/apilist/API-SEARCH.md */

async function apiSearch(key) {
  return await NF.searchFoods({ q: key, ds: 'Standard Reference' }); 
}

async function search(key) {
  let results = await apiSearch(key);

  let arr = await Promise.all(results.list.item.map(async (element) => {
    let food = {};
    food['name'] = element.NAME;
    food['group'] = element.GROUP;

    const apiNutrition = await element.getNutrition();
    
    let nutrition = {};
    apiNutrition.nutrients.forEach(nutrient => {
      nutrition[nutrient.name] = parseFloat(nutrient.value);
    });

    food['nutrition'] = nutrition;
    food['measures'] = apiNutrition.nutrients[0].measures;
    
    return food;
  }));

  return arr;
}

/*
// Alternatively, if you know the NDBNO off-hand
// you can call 'getNutrition' from the NF instance.

NF.getNutrition('01001','b')
.then(nutritionReport => {
    console.log(nutritionReport)
})
.catch(err => {
    console.log(err)
})
*/

exports.search = search;