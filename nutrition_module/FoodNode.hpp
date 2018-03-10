#ifndef FOODNODE_H
#define FOODNODE_H

#include "Node.hpp"
#include "Food.hpp"

using FoodNode = Node<Food>;
using FoodNodePtr = std::shared_ptr<FoodNode>;

#endif // FOODNODE_H
