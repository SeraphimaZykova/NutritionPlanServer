#include "NutritionModule.h"

namespace NutritionAnalyzer
{
  auto prepareFoodTree = [](const std::multimap<int16_t, FoodAvailable>& giMap, auto overheadingComparator) -> FoodTree
  {
    FoodTree tree;

    uint64_t N = (!giMap.empty()) ? 1 : 0;

    for (auto iter = giMap.begin(); iter != giMap.end(); ++iter)
    {
      auto foodAvailable = iter->second;
      //std::cout << "available " << foodAvailable.maxWeightAvailable << " of " << foodAvailable.food.getName() << std::endl;

      auto sub = tree.createSubTree(foodAvailable, overheadingComparator);
      if (sub.size() > 0)
      {
        N *= sub.size();
        tree.addLeaves(sub, overheadingComparator);
        //tree.print();
      }
    }

    std::cout << "N = " << N << std::endl;

    return tree;
  };

  bool createDailyNutritionPlan(const std::multimap<int16_t, FoodAvailable>& giMap
    , const Nutrition& idealNutrition
    , const Nutrition& allowedNutritionOverheading
    , const std::function<void(const FoodTree::Ration&, const Nutrition&, const NutritionError&)>& resultCallback
    )
  {
    auto overheadingComparator = [idealNutrition, &allowedNutritionOverheading](const Nutrition& nutrition) -> bool
    {
      auto overheading = NutritionError::overheading(idealNutrition, nutrition);

      return overheading.carbs < allowedNutritionOverheading.carbs
          && overheading.proteins < allowedNutritionOverheading.proteins
          && overheading.fats < allowedNutritionOverheading.fats
          && overheading.kkal < allowedNutritionOverheading.kkal;
    };

    float allowedError = 1;
    auto allowedErrorComparator = [idealNutrition, &allowedError](const Nutrition& nutrition) -> bool
    {
      NutritionError error(idealNutrition, nutrition);
      auto err = error.error();
      if (err < allowedError)
      {
        allowedError = err;
        return true;
      }

      return false;
    };

    auto tree = prepareFoodTree(giMap, overheadingComparator);
    auto rationList = tree.depthSearch(allowedErrorComparator, overheadingComparator);

    std::cout << "ration variants: " << rationList.size() << std::endl;

    FoodTree::Ration* minErrorRation = nullptr;
    Nutrition minErrorNutrition(0, 0, 0, 0);
    NutritionError minError(idealNutrition, minErrorNutrition);

    for (auto ration = rationList.begin(); ration != rationList.end(); ++ration)
    {
      Nutrition sum(0, 0, 0, 0);
      for (auto iter = ration->begin(); iter != ration->end(); ++iter)
      {
        sum += (*iter)->getPortionNutrition();
      }

      NutritionError error(idealNutrition, sum);
      if (error.error() < minError.error())
      {
        minError = error;
        minErrorNutrition = sum;
        minErrorRation = &(*ration);
      }
    }

    if (minErrorRation && resultCallback)
    {
      resultCallback(*minErrorRation, minErrorNutrition, minError);
      return true;
    }

    return false;
  }

}