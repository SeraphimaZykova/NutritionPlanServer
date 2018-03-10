#ifndef NUTRIENT_H
#define NUTRIENT_H

#include <iostream>

enum class Nutrient { Proteins, Carbs, Fats, Energy };
static std::ostream& operator << (std::ostream& os, const Nutrient& obj)
{
  switch (obj)
  {
  case Nutrient::Proteins:
    os << "Proteins";
  break;

  case Nutrient::Carbs:
    os << "Carbohydrates";
  break;

  case Nutrient::Fats:
    os << "Fats";
  break;

  case Nutrient::Energy:
    os << "Kkal";
  break;

  default:
  break;
  }

  return os;
}

#endif // NUTRIENT_H
