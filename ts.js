let removeUndef = (array) => {
  return array.filter(e => e !== undefined && !isNaN(e));
}

console.log(removeUndef([1,0,'',undefined,34,NaN]));