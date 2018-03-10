#ifndef FOODTREE_H
#define FOODTREE_H

#include "FoodNode.hpp"
#include "FoodAvailable.hpp"

using SubTree = std::list<FoodNodePtr>;

class FoodTree
{
public:
  using Ration = std::list<const Food*>;
  using RationList = std::list<std::list<const Food*>>;

  using NutritionErrorComparator = std::function<bool(const Nutrition&)>;

  FoodTree();
  virtual ~FoodTree();

  SubTree createSubTree(FoodAvailable& avFood, const NutritionErrorComparator& overheadingComparator) const;

  void addLeaves(const std::list<FoodNodePtr>& sub, const NutritionErrorComparator& overheadingComparator);

  void print() const;

  RationList depthSearch(const NutritionErrorComparator& allowedErrorComparator
                         , const NutritionErrorComparator& overheadingComparator);

private:
  void setPortion(Food& food, uint16_t& portion, uint16_t maxDaily, uint16_t maxAvailable) const;
  FoodNodePtr createNode(const Food& food, const NutritionErrorComparator& overheadingComparator) const;

private:
  FoodNodePtr root_;
  std::list<FoodNodePtr> leaves_;
};

#endif // FOODTREE_H
