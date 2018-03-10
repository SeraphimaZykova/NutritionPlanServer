#ifndef FOODAVAILABLE_H
#define FOODAVAILABLE_H

#include "Food.hpp"

struct FoodAvailable
{
  struct Daily
  {
    uint16_t minDailyPortion = 0;
    uint16_t preferredDailyPortion = 0; //TODO: remove 
    uint16_t maxDailyPortion = 0;

    Daily(uint16_t max = 0, uint16_t preferred = 0, uint16_t min = 0)
      : minDailyPortion(min)
      , preferredDailyPortion(preferred)
      , maxDailyPortion(max)
    {}
  };

  Food food = Food("");

  uint16_t maxWeightAvailable = 0;
  uint16_t deltaPortion = 10;
  bool fixedDelta = false;
  Daily daily;

  FoodAvailable(const Food& food, uint16_t maxWeight = 0, uint16_t delta = 0, const Daily& daily = Daily())
    : food(food)
    , maxWeightAvailable(maxWeight)
    , deltaPortion(delta)
    , daily(daily)
  {
    fixedDelta = (delta > 0);
  }
};

#endif // FOODAVAILABLE_H
