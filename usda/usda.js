const axios = require("axios");
  
/* https://ndb.nal.usda.gov/ndb/doc/apilist/API-SEARCH.md */

async function searchName(key) {
   const addr = "https://api.nal.usda.gov/ndb/search/?format=json&";
   let url = addr + "q=" + key + "&ds=Standard%20Reference&max=50&sort=r&offset=0&api_key=" + process.env.USDA_NDB_API_KEY;
   
   try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.log('err in seName req')
    console.error(error.message);
  }
}

async function getNutrition(ndbno){
  const addr = "https://api.nal.usda.gov/ndb/reports/?";
  let url = addr + "ndbno=" + ndbno + "&type=b&format=json&api_key=" + process.env.USDA_NDB_API_KEY;
  
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.log('err in getNutrition req')
    console.error(error);
  }
}

async function search(key) {
  let results = await searchName(key);
  if (!results) return new Array();

  let arr = Promise.all(results.list.item.map(async (element) => {
    let food = {};
    food['name'] = element.name;
    food['group'] = element.group;

    const report = await getNutrition(element.ndbno);
    if (!report) return null;

    let nutrition = {};
    report.report.food.nutrients.forEach(nutrient => {
      nutrition[nutrient.name] = {
        'value': parseFloat(nutrient.value),
        'unit': nutrient.unit
      }
    });

    food['nutrition'] = nutrition;
    food['measures'] = report.report.food.nutrients[0].measures;
    
    return food;
  }));

  return arr;
}

exports.search = search;
