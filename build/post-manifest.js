'use strict';

/* global require, exports */

// Bug 957418, we need this to fix the origin case when
// running in Firefox Nightly. We change the origin from app:// to
// http:// so the ports will work properly in Nightly, so we still need
// this unless there is a better way of doing it.
const utils = require('./utils');

/**
 * Updates hostnames for InterApp Communication APIs
 */
function manifestInterAppHostnames(manifest, config) {
  function convertToLocalUrl(url) {
    var host = config.GAIA_DOMAIN + config.GAIA_PORT;

    return url
      .replace(/^(http|app):\/\//, config.GAIA_SCHEME)
      .replace(/gaiamobile.org(:[0-9])?/, host);
  }
  
  for (let i in manifest.connections) {
    var connection = manifest.connections[i];
    if (!connection.rules || !connection.rules.manifestURLs) {
      continue;
    }

    var manifestURLs = connection.rules.manifestURLs;
    manifestURLs = manifestURLs.map(convertToLocalUrl);
  }

  return manifest;
}

function execute(options) {
  const WEBAPP_FILENAME = 'manifest.webapp';
  const UPDATE_WEBAPP_FILENAME = 'update.webapp';
  var targetWebapp = utils.getWebapp(options.APP_DIR,
    options.GAIA_DOMAIN, options.GAIA_SCHEME,
    options.GAIA_PORT, options.STAGE_DIR);

  if (utils.isExternalApp(targetWebapp)) {
    return;
  }

  var webappManifest = targetWebapp.buildDirectoryFile.clone();
  var updateManifest = targetWebapp.buildDirectoryFile.clone();
  webappManifest.append(WEBAPP_FILENAME);
  updateManifest.append(UPDATE_WEBAPP_FILENAME);
  var stageManifest =
    webappManifest.exists() ? webappManifest : updateManifest;

  if (!stageManifest.exists()) {
    return;
  }
  var manifestContent = utils.getJSON(stageManifest);
  if (manifestContent.connections) {
    manifestContent =
      manifestInterAppHostnames(manifestContent, options);
    utils.writeContent(stageManifest, JSON.stringify(manifestContent));
  }
}
exports.execute = execute;
