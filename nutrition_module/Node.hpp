#ifndef NODE_H
#define NODE_H

#include <list>
#include <iostream>

template <class T>
class Node
{
public:
  using list_t = std::list<std::shared_ptr<Node>>;

  Node()
    : body_(T())
    , sub_()
  {}

  Node(const T& body)
    : body_(body)
    , sub_()
  {}

  Node(const T& body, const list_t& sub)
    : body_(body)
    , sub_(sub)
  {}

  Node(const Node& other) = delete;
  Node& operator =(const Node& other) = delete;

  virtual ~Node() = default;

  void setSub(const list_t& sub) { sub_ = sub; }

  const T& getBody() const { return body_; }
  const list_t& getSub() const { return sub_; }


  typename list_t::iterator eraseSub(typename list_t::const_iterator iter)
  {
    return sub_.erase(iter, sub_.end());
  }

private:
  T body_;
  list_t sub_;
};

#endif // NODE_H
