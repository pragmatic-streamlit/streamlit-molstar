module.exports = (api) => {

  api.cache.using(() => process.env.NODE_ENV);

  const presets = [
    "@babel/preset-react",
    ["@babel/preset-env", {
      "targets": {
        "chrome": 41,
      },
      "useBuiltIns": "usage",
      "corejs": {
        "version": 3,
        "proposals": true,
      },
    }],
  ];

  const plugins = [];

  const ignore = [ ];

  // We exclude node_modules as they would cause a lot of warnings.
  ignore.push("node_modules");

  return {
    "presets": presets,
    "plugins": plugins,
    "ignore": ignore,
  }
};