#include "FoodTree.hpp"

#include <iostream>
#include <ctime>


void printSub(const FoodNode& node)
{
  std::cout << node.getBody().getName() << " (" << node.getBody().getPortionMass() << ") sub:\n";
  auto sub = node.getSub();

  for (auto subIter = sub.begin(); subIter != sub.end(); ++subIter)
  {
    std::cout << (*subIter)->getBody().getName() << " " << (*subIter)->getBody().getPortionMass() << std::endl;
  }
}


void depthSearch(FoodNodePtr node
                 , FoodTree::Ration& ration
                 , Nutrition& rationNutrition
                 , FoodTree::RationList& rationList
                 , const FoodTree::NutritionErrorComparator& comparator
                 , const FoodTree::NutritionErrorComparator& overheadingComparator)
{
  auto& body = node->getBody();
  auto& sub = node->getSub();

  if (body.getPortionMass() > 0)
  {
    rationNutrition += body.getPortionNutrition();
    ration.emplace_back(&body);
  }

  if (overheadingComparator(rationNutrition))
  {
    if (!sub.empty())
    {
      for (auto iter = sub.begin(); iter != sub.end(); ++iter)
      {
        depthSearch(*iter, ration, rationNutrition, rationList, comparator, overheadingComparator);
      }
    }
    else
    {
      if (!ration.empty() && comparator(rationNutrition))
      {
        rationList.emplace_back(ration);
      }
    }
  }

  if (body.getPortionMass() > 0)
  {
    rationNutrition -= body.getPortionNutrition();
    ration.pop_back();
  }
}

FoodTree::FoodTree()
  : root_(new FoodNode(Food("")))
  , leaves_()
{
  leaves_.push_back(root_);
}

FoodTree::~FoodTree()
{}

SubTree FoodTree::createSubTree(FoodAvailable& avFood, const FoodTree::NutritionErrorComparator& overheadingComparator) const
{
  SubTree subTree;
  const auto& daily = avFood.daily;

  if (avFood.maxWeightAvailable == 0 || daily.maxDailyPortion == 0)
    return subTree;

  uint16_t portion = daily.minDailyPortion;
  Food food(avFood.food);

  if (!avFood.fixedDelta)
  {
    if (daily.preferredDailyPortion > 0) {
      avFood.deltaPortion = daily.preferredDailyPortion;
    }
    else {
      static const float OptimumKkalConst = 100.0f * 85 ; //as in curd
      avFood.deltaPortion = OptimumKkalConst / food.getNutrient(Nutrient::Energy);
    }

    std::cout << " ~ set " << food.getName() << " delta = " << avFood.deltaPortion << "\n";
  }


  setPortion(food, portion, daily.maxDailyPortion, avFood.maxWeightAvailable);
  auto node = createNode(food, overheadingComparator);
  if (!node)
  {
    return subTree;
  }

  subTree.emplace_back(node);

  while (portion < daily.maxDailyPortion && portion < avFood.maxWeightAvailable) {
    portion += avFood.deltaPortion;

    setPortion(food, portion, daily.maxDailyPortion, avFood.maxWeightAvailable);
    auto node = createNode(food, overheadingComparator);
    if (!node)
    {
      return subTree;
    }

    subTree.emplace_back(node);
  }

  return subTree;
}

void FoodTree::addLeaves(const std::list<FoodNodePtr>& sub, const NutritionErrorComparator& overheadingComparator)
{
  for (auto iter = leaves_.begin(); iter != leaves_.end(); ++iter)
  {
    std::list<FoodNodePtr> filtered;

    for (auto subIter = sub.begin(); subIter != sub.end(); ++subIter)
    {
      auto checkNutrition = (*iter)->getBody().getPortionNutrition() + (*subIter)->getBody().getPortionNutrition();
      if (overheadingComparator(checkNutrition))
      {
        filtered.emplace_front(*subIter);
      }
      else
      {
        std::cout << "compare "<< (*iter)->getBody().getName() << " (" << (*iter)->getBody().getPortionMass() << ") "
                  << " + " << (*subIter)->getBody().getName() << " (" << (*subIter)->getBody().getPortionMass() << ")" << std::endl;

        std::cout << "overhead: " << checkNutrition.kkal << " | " << checkNutrition.proteins << "/"
                  << checkNutrition.carbs << "/" << checkNutrition.fats << std::endl;
        break;
      }
    }

    (*iter)->setSub(filtered);

    //printSub(*iter->get());
  }

  leaves_ = sub;
}

void FoodTree::print() const
{
  std::cout << "\ntree leaves: \n";

  for (auto iter = leaves_.begin(); iter != leaves_.end(); ++iter)
  {
    std::cout << (*iter)->getBody().getName() << " " <<(*iter)->getBody().getPortionMass() << "/ \n";
  }
}

FoodTree::RationList FoodTree::depthSearch(const NutritionErrorComparator& allowedErrorComparator
                                           , const NutritionErrorComparator& overheadingComparator)
{
  FoodTree::Ration list;
  Nutrition rationNutrition(0, 0, 0, 0);

  FoodTree::RationList rationList;

  clock_t begin = clock();
  ::depthSearch(root_, list, rationNutrition, rationList, allowedErrorComparator, overheadingComparator);
  clock_t end = clock();
  double elapsed_secs = double(end - begin) / CLOCKS_PER_SEC;

  std::cout << "\n ~ depth search time " << elapsed_secs << std::endl << std::endl;

  return rationList;
}

void FoodTree::setPortion(Food& food, uint16_t& portion, uint16_t maxDaily, uint16_t maxAvailable) const
{
  if (portion > maxDaily) {
    portion = maxDaily;
  }

  if (portion > maxAvailable) {
    portion = maxAvailable;
  }

  food.setPortion(portion);
}

FoodNodePtr FoodTree::createNode(const Food& food, const FoodTree::NutritionErrorComparator& overheadingComparator) const
{
  if (overheadingComparator(food.getPortionNutrition()))
  {
    return FoodNodePtr(new FoodNode(food));
  }

  return nullptr;
}
