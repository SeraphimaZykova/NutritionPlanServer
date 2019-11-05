module.exports = function() {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += Math.floor(Math.random() * Math.floor(10));
  }

  return code;
}