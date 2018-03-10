#include "Food.hpp"

#include <iostream>
#include <assert.h>
#include <string>

Food::Food(const std::string& name, float p, float c, float f, uint16_t k)
  : name_(name)
  , id_(std::hash<std::string>()(std::string(name)))
  , nutrition_(k, p, c, f)
  , portionMass_(0)
  , portionNutrition_(0, 0, 0, 0)
{

}

Food::Food(const Food& other)
  : name_(other.name_)
  , id_(std::hash<std::string>()(std::string(name_)))
  , nutrition_(other.nutrition_.kkal
               , other.nutrition_.proteins
               , other.nutrition_.carbs
               , other.nutrition_.fats)
  , portionMass_(other.portionMass_)
  , portionNutrition_(other.portionNutrition_.kkal
                      , other.portionNutrition_.proteins
                      , other.portionNutrition_.carbs
                      , other.portionNutrition_.fats)
{

}

void Food::setPortion(const int gram)
{
  portionMass_ = gram;

  portionNutrition_.kkal = nutrition_.kkal * 0.01 * portionMass_;
  portionNutrition_.proteins = nutrition_.proteins * 0.01 * kkalPerProteinGram * portionMass_;
  portionNutrition_.carbs = nutrition_.carbs * 0.01 * kkalPerCarbohydrateGram * portionMass_;
  portionNutrition_.fats = nutrition_.fats * 0.01 * kkalPerFatGram * portionMass_;

  /*
  std::cout << "portion " << portionMass
            << ": kkal " << portionKkal
            << ", p " << portionProteins
            << ", c " << portionCarbohydrates
            << ", f " << portionFats
            << std::endl;

  assert(portionNutrition_.kkal != (portionNutrition_.proteins + portionNutrition_.carbohydrates + portionNutrition_.fats)
      && "portion kkal error");
  */
}

bool Food::operator < (const Food& rhs) const
{
  return id_ < rhs.id_;
}

bool Food::operator ==(const Food& rhs) const
{
  return id_ == rhs.id_;
}

const char* Food::getName() const
{
  return name_.c_str();
}

unsigned int Food::getPortionMass() const
{
  return portionMass_;
}

const Nutrition& Food::getNutrition() const
{
  return nutrition_;
}

const Nutrition& Food::getPortionNutrition() const
{
  return portionNutrition_;
}

float Food::getNutrient(const Nutrient& nutrient) const
{
  switch (nutrient) {
  case Nutrient::Proteins:
    return nutrition_.proteins;

  case Nutrient::Carbs:
    return nutrition_.carbs;

  case Nutrient::Fats:
    return nutrition_.fats;

  case Nutrient::Energy:
    return nutrition_.kkal;

  default:
  break;
  }

  return 0;
}
