module.exports = config => {
    config.addPassthroughCopy('src/img/');
    config.addPassthroughCopy('src/*.html')
    return {
      dir: {
        input: 'src',
        output: 'dist'
      }
    };
  };