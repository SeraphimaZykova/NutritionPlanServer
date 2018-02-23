# NutritionPlanServer

food data format:
```
{
  foodInfo: {
    _id: oid,
    name: string,
    glycemicIndex: int,
    nutrition: {
      calories: float,
      proteins: float,
      carbs: float,
      fats: float
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
