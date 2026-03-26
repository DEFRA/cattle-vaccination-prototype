function errorToPlainObject(err) {
  return {
    name: err.name,
    message: err.message,
    stack: err.stack,
  };
}

module.exports = { errorToPlainObject }