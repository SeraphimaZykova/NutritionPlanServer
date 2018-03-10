#ifndef NUTRITIONMODULE_H
#define NUTRITIONMODULE_H

#include <map>
#include <functional>

#include "Nutrition.hpp"
#include "NutritionError.hpp"
#include "FoodTree.hpp"

namespace NutritionAnalyzer
{
  bool createDailyNutritionPlan(
    const std::multimap<int16_t, FoodAvailable>& giMap
    , const Nutrition& idealNutrition
    , const Nutrition& allowedNutritionOverheading
    , const std::function<void(const FoodTree::Ration&, const Nutrition&, const NutritionError&)>& resultCallback
  );
}

#endif // NUTRITIONMODULE_H
