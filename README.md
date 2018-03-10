# NutritionPlanServer

food data format:
```
{
  foodInfo: {
    _id: oid,
    name: string,
    glycemicIndex: int,
    gramsPerPiece: int,
    piecesPerPack: int,
    nutrition: {
      calories: {
        total: float,
        fromFat: float
      }
      proteins: float,
      carbs: {
        total: float,
        dietaryFiber: float,
        sugars: float
      }
      fats: {
        total: float,
        saturated: float,
        trans: float,
        polyunsanurated: float,
        monounsaturated: float
      },
      cholesterol: float,
      sodium: float,
      potassium: float,
      vitaminA: float,
      vitaminC: float,
      calcium: float,
      iron: float
    }
  },
  pantryInfo: {
    foodId: oid,
    available: int,
    daily: {
      min: int,
      max: int
    }
  },
  userInfo: {
    userId: oid
  }
}
```
upd:
```
{
  userId: oid,
  updOid: oid,
  field: string,
  value: auto
}
```