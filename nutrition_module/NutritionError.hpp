#ifndef NUTRITIONERROR_H
#define NUTRITIONERROR_H

#include <assert.h>
#include <cmath>

#include "Nutrition.hpp"
#include "Nutrient.hpp"

struct NutritionError
{
  float proteinsErr = 0;
  float carbsErr = 0;
  float fatsErr = 0;
  float kkalErr = 0;

  NutritionError() {}

  NutritionError(const Nutrition& ideal, const Nutrition& actual)
  {
    compareActual(ideal, actual);
  }

  float error() const
  {
    return std::max(abs(kkalErr), std::max(abs(proteinsErr), std::max(abs(carbsErr), abs(fatsErr))));
  }

  void compareActual(const Nutrition& ideal, const Nutrition& actual)
  {
    kkalErr = 1 - actual.kkal / ideal.kkal;
    proteinsErr = 1 - actual.proteins / ideal.proteins;
    carbsErr = 1 - actual.carbs / ideal.carbs;
    fatsErr = 1 - actual.fats / ideal.fats;

    assert(kkalErr >= -1);
    assert(proteinsErr >= -1);
    assert(carbsErr >= -1);
    assert(fatsErr >= -1);

    assert(kkalErr <= 1);
    assert(proteinsErr <= 1);
    assert(carbsErr <= 1);
    assert(fatsErr <= 1);
  }

  static Nutrition overheading(const Nutrition& ideal, const Nutrition& actual)
  {
    return Nutrition(actual.kkal / ideal.kkal - 1
                     , actual.proteins / ideal.proteins - 1
                     , actual.carbs / ideal.carbs - 1
                     , actual.fats / ideal.fats - 1);
  }

  static float maxOverheading(const Nutrition& ideal, const Nutrition& actual)
  {
    auto pOver = actual.proteins / ideal.proteins - 1;
    auto cOver = actual.carbs / ideal.carbs - 1;
    auto fOver = actual.fats / ideal.fats - 1;
    auto kOver = actual.kkal / ideal.kkal - 1;

    return std::max(pOver, std::max(cOver, std::max(fOver, kOver)));
  }

  Nutrient maxErrorNutrient() const
  {
    auto max = std::max(proteinsErr, std::max(carbsErr, fatsErr));
    Nutrient meNutrient = (fatsErr == max) ? Nutrient::Fats : ((carbsErr == max) ? Nutrient::Carbs : Nutrient::Proteins);
    return meNutrient;
  }

  Nutrient minErrorNutrient() const
  {
    auto min = std::min(proteinsErr, std::min(carbsErr, fatsErr));
    Nutrient meNutrient = (proteinsErr == min) ? Nutrient::Proteins : ((carbsErr == min) ? Nutrient::Carbs : Nutrient::Fats);
    return meNutrient;
  }

  bool operator == (const NutritionError& rhs) const
  {
    return (kkalErr == rhs.kkalErr
            && proteinsErr == rhs.proteinsErr
            && carbsErr == rhs.carbsErr
            && fatsErr == rhs.fatsErr);
  }

  bool operator != (const NutritionError& rhs) const
  {
    return (kkalErr != rhs.kkalErr
           || proteinsErr != rhs.proteinsErr
           || carbsErr != rhs.carbsErr
           || fatsErr != rhs.fatsErr);
  }
};

#endif // NUTRITIONERROR_H
