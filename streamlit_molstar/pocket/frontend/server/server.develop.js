const fs = require("fs");
const path = require("path");
const express = require("express");
const webpack = require("webpack");
const webpackConfig = require("../build/webpack.develop.js");
const webpackMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
const proxy = require("express-http-proxy");

const logger = require("./logging");
const configuration = require("./configuration");

(function main() {
  const app = express();
  initializeStatic(app);
  initializeApi(app);
  initializeWebpack(app);
  start(app);
})();

function initializeStatic(app) {
  app.use("/assets", express.static(getAssetsPath()));
}

function getAssetsPath() {
  return path.join(__dirname, "..", "public", "assets");
}

function initializeApi(app) {
  if (configuration["proxy-service"]) {
    app.use("/api", proxy(
      configuration["proxy-service"], {
        "limit": "8mb",
        "proxyReqPathResolver": (request) => "/api" + request.url,
      }));
  } else if (configuration["proxy-directory"]) {
    const apiDirectory = path.join(
      __dirname, configuration["proxy-directory"]);
    app.use("/api/v2/prediction", express.static(apiDirectory));
    logger.info("Serving API from directory.", {"path": apiDirectory});
  }
}

function initializeWebpack(app) {
  const webpackCompiler = webpack(webpackConfig);
  const middleware = webpackMiddleware(webpackCompiler, {
    "publicPath": webpackConfig.output.publicPath.substr(1),
    "stats": {
      "colors": true,
      "chunks": false,
    },
  });
  app.use(webpackHotMiddleware(webpackCompiler));
  app.use(middleware);

  const serveFromWebpack = createServeWebpackFile(webpackCompiler);

  // We add some extra file mapping as the URL can be
  // {domain}/id/2src_2 and we need to return the gith files for
  // {domain}/id/2src_2/bundle.js, etc ...
  app.get("/*", (req, res) => {
    const url = req.originalUrl.substr(1);
    if (url.startsWith("analyze")) {
      if (url.includes("analyze.js")) {
        serveFromWebpack("analyze.js", res);
      } else if (url.includes("assets")) {
        serveFromFile(getAssetsPath(), url.replace(/.*assets\//, ""), res);
      } else {
        // Anything starting with 'analyze'.
        serveFromWebpack("analyze.html", res);
      }
    } 
    else if(url.startsWith("viewer")) {
      if (url.includes("viewer.js")) {
        serveFromWebpack("viewer.js", res);
      } else if (url.includes("assets")) {
        serveFromFile(getAssetsPath(), url.replace(/.*assets\//, ""), res);
      } else {
        // Anything starting with 'viewer'.
        serveFromWebpack("viewer.html", res);
      }
    }   
    else if (url.includes(".")) {
      // Full path with extension.
      serveFromWebpack(url, res);
    } else {
      // For all rest we just assume there is '.html' missing.
      serveFromWebpack(url + ".html", res);
    }
  });

}

function createServeWebpackFile(webpackCompiler) {
  return function serveWebpackFile(fileName, response) {
    const indexFile = path.resolve(webpackCompiler.outputPath, fileName);
    webpackCompiler.outputFileSystem.readFile(indexFile, (error, result) => {
      response.end(result);
    });
  }
}

function serveFromFile(directoryPath, filePath, res) {
  const fullPath = path.join(directoryPath, filePath);
  fs.readFile(fullPath, (error, result) => {
    res.end(result);
  });
}

function start(app) {
  const port = configuration.port;
  app.listen(port, function onStart(error) {
    if (error) {
      logger.error("Can't start server.", {"error": error});
    }
    logger.info("Server has been started.", {"port": port});
  });
}
