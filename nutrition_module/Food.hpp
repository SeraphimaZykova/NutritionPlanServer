#ifndef FOOD_H
#define FOOD_H

#include <stdint.h>
#include "Nutrition.hpp"
#include "Nutrient.hpp"

const float kkalPerFatGram = 9.29;
const float kkalPerProteinGram = 4.11;
const float kkalPerCarbohydrateGram = 4.11;

class Food
{
public:
  Food(const std::string& name, float p = 0, float c = 0, float f = 0, uint16_t k = 0);
  Food(const Food& other);
  ~Food() = default;

  void setPortion(const int gram);

  bool operator < (const Food& rhs) const;
  bool operator == (const Food& rhs) const;

  const char* getName() const;
  unsigned int getPortionMass() const;

  const Nutrition& getNutrition() const;
  const Nutrition& getPortionNutrition() const;

  float getNutrient(const Nutrient& nutrient) const;

private:
  std::string name_ = "";
  const int64_t id_;

  /* per 100g */
  const Nutrition nutrition_;

  /* portion */
  unsigned int portionMass_ = 0;
  Nutrition portionNutrition_;
};

#endif // FOOD_H
