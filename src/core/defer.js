let defer = {
  all: (promises) => {
    return Promise.all(promises);
  },

  race: (promises) => {
    return Promise.race(promises);
  },

  resolve: (value) => {
    return Promise.resolve(value);
  },

  reject: (reason) => {
    return Promise.reject(reason);
  }
};

export default defer;
