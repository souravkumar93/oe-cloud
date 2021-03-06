/**
 * 
 * ©2016-2017 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 * 
 */
// Setting /designer route.
// To install evf-designer run bower install evf-designer
// Path to evf-designer should be /client/bower_components or /public/bower_components or /web/bower_components
// Or else the path to evf-designer can be configured in configuration
// Or else the application itself can add a route for /designer with the location of index.html from evf-designer directory.
/* eslint-disable no-console */
var loopback = require('loopback');
var fs = require('fs');
var path = require('path');
var logger = require('../../lib/logger');
var log = logger('evf-designer');
var _ = require('lodash');
var util = require('../../lib/common/util');
var appconfig = require('../config');
var glob = require('glob');


function setEvfDesignerPath(evfDesignerPath, server) {
  if (!appconfig.designer.templatePath || appconfig.designer.templatePath.length === 0) {
    appconfig.designer.templatePath = [evfDesignerPath + '/evf-designer/templates'];
  }
  if (!appconfig.designer.stylePath || appconfig.designer.stylePath.length === 0) {
    appconfig.designer.stylePath = [evfDesignerPath + '/evf-designer/styles'];
  }
  if (!appconfig.designer.assetPath || appconfig.designer.assetPath.length === 0) {
    appconfig.designer.assetPath = ['client/images'];
  }

  var templatesData = [];
  appconfig.designer.templatePath.forEach(function templatePathForEach(tPath) {
    ifDirectoryExist(tPath, function ifDirectoryExistFn(dirName, status) {
      if (status) {
        var templateFiles = fs.readdirSync(dirName);
        templateFiles.forEach(function templateFilesForEach(fileName) {
          var tplRecord = {
            file: fileName,
            path: dirName,
            content: fs.readFileSync(dirName + '/' + fileName, {
              encoding: 'utf-8'
            })
          };
          var regex = /Polymer\s*\(/;
          if (tplRecord.content && regex.test(tplRecord.content)) {
            if (tplRecord.content.indexOf(':modelAlias') >= 0) {
              tplRecord.type = 'form';
            } else {
              tplRecord.type = 'component';
            }
          } else {
            tplRecord.type = 'html';
          }
          templatesData.push(tplRecord);
        });
      }
    });
  });
  module.templatesData = templatesData;

  var stylesData = [];
  appconfig.designer.stylePath.forEach(function stylePathForEach(sPath) {
    ifDirectoryExist(sPath, function ifDirectoryExistFn(dirName, status) {
      if (status) {
        var styleFiles = fs.readdirSync(dirName);
        styleFiles.forEach(function styleFilesForEach(fileName) {
          var styleRecord = {
            file: fileName,
            path: dirName
          };
          stylesData.push(styleRecord);
        });
      }
    });
  });
  module.stylesData = stylesData;

  var assetData = {
    images: [],
    videos: [],
    audios: []
  };

  var imageTypes = ['.JPG', '.JPEG', '.BMP', '.GIF', '.PNG', '.SVG'];
  var videoTypes = ['.MP4', '.MPEG', '.AVI', '.WMV', '.OGG', '.OGM', '.OGV', '.WEBM', '.3GP'];
  var audioTypes = ['.MP3', '.AAC', '.OGG', '.M4A'];
  appconfig.designer.assetPath.forEach(function assetPathForEach(aPath) {
    ifDirectoryExist(aPath, function ifDirectoryExist(dirName, status) {
      if (status) {
        var assetFiles = fs.readdirSync(dirName);
        assetFiles.forEach(function assetFilesForEach(fileName) {
          var stats = fs.statSync(path.join(dirName, fileName));
          if (stats.isFile()) {
            var assetRecord = {
              file: fileName,
              path: dirName,
              size: stats.size
            };
            var fileExtn = path.extname(fileName).toUpperCase();
            if (imageTypes.indexOf(fileExtn) >= 0) {
              assetData.images.push(assetRecord);
            } else if (videoTypes.indexOf(fileExtn) >= 0) {
              assetData.videos.push(assetRecord);
            } else if (audioTypes.indexOf(fileExtn) >= 0) {
              assetData.audios.push(assetRecord);
            }
          }
        });
      }
    });
  });
  module.assetData = assetData;

  var prospectElements = [];
  glob('client/**/*.html', function globFn(err, files) {
    if (!err && files && files.length > 0) {
      files.forEach(function filesForEach(file) {
        if (file.indexOf('evf-designer') < 0 && file.indexOf('/demo/') < 0 && file.indexOf('/test/') < 0) {
          fs.readFile(file, function read(err3, data) {
            var regexp = /<dom-module\s*id\s*=\s*["'](.*)["']\s*>/g;
            if (!err3) {
              var match = regexp.exec(data);
              if (match && match[1] && match[1] !== ':componentName') {
                prospectElements.push({
                  name: match[1],
                  tag: match[1],
                  icon: 'icons:polymer',
                  description: match[1],
                  content: '<' + match[1] + '></' + match[1] + '>',
                  category: 'polymerElements',
                  config: {
                    domType: 'Polymer',
                    attributes: [],
                    importUrl: file.substr(6),
                    type: 'droppable'
                  },
                  previewImg: ''
                });
              }
            }
          });
        }
      });
    }
  });
  module.prospectElements = prospectElements;

  var evEnsureLoggedIn = function evEnsureLoggedIn(req, res, next) {
    if (req.accessToken) {
      next();
    } else {
      res.redirect('/login');
      return;
    }
  };

  server.use(loopback.static(evfDesignerPath));
  server.get(appconfig.designer.mountPath, evEnsureLoggedIn, function sendResponse(req, res) {
    res.sendFile('index.html', {
      root: evfDesignerPath + '/evf-designer'
    });
  });


  server.get('/designerRoutes/:model', function designerRoutes(req, res) {
    var model = req.params.model;
    var remotes = server.remotes();
    var adapter = remotes.handler('rest').adapter;
    var routes = adapter.allRoutes();
    var classes = remotes.classes();
    routes = routes.map(function routesMapFn(route) {
      if (!route.documented) {
        return;
      }

      // Get the class definition matching this route.
      var className = route.method.split('.')[0];
      var classDef = classes.filter(function clasesFilter(item) {
        return item.name === className;
      })[0];

      if (!classDef) {
        console.error('Route exists with no class: %j', route);
        return;
      }
      var accepts = route.accepts || [];
      var split = route.method.split('.');
      /* HACK */
      if (classDef && classDef.sharedCtor &&
        classDef.sharedCtor.accepts && split.length > 2) {
        accepts = accepts.concat(classDef.sharedCtor.accepts);
      }

      // Filter out parameters that are generated from the incoming request,
      // or generated by functions that use those resources.
      accepts = accepts.filter(function acceptsFilter(arg) {
        if (!arg.http) {
          return true;
        }
        // Don't show derived arguments.
        if (typeof arg.http === 'function') {
          return false;
        }
        // Don't show arguments set to the incoming http request.
        // Please note that body needs to be shown, such as User.create().
        if (arg.http.source === 'req' ||
          arg.http.source === 'res' ||
          arg.http.source === 'context') {
          return false;
        }
        return true;
      });
      route.accepts = accepts;
      route.verb = convertVerb(route.verb);
      return {
        path: route.path,
        type: route.verb,
        description: route.description,
        accepts: route.accepts
      };
    });
    var modelEndPoints = _.groupBy(routes, function modelEndPoints(d) {
      return d.path.split('/')[1];
    });
    var result = model ? modelEndPoints[model] : modelEndPoints;
    res.send(JSON.stringify(result));
  });
  server.get('/designer.html', function sendDesignerHomePage(req, res) {
    res.redirect(appconfig.designer.mountPath);
  });

  server.get(appconfig.designer.mountPath + '/config', function designerConfig(req, res) {
    res.json(appconfig.designer);
  });

  server.get(appconfig.designer.mountPath + '/templates', function designerTemplates(req, res) {
    res.json(module.templatesData);
  });

  server.get(appconfig.designer.mountPath + '/styles', function designerStyles(req, res) {
    res.json(module.stylesData);
  });

  server.post(appconfig.designer.mountPath + '/save-theme', function saveTheme(req, res) {
    fs.writeFile('client/styles/app-theme.html', req.body.data, function writeFileCbFn(err) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json({
          status: true
        });
      }
    });
  });

  server.post(appconfig.designer.mountPath + '/apply-theme', function saveTheme(req, res) {
    var content = fs.readFileSync(req.body.file, {
      encoding: 'utf-8'
    });
    fs.writeFile('client/styles/app-theme.html', content, function writeFileCbFn(err) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json({
          status: true
        });
      }
    });
  });

  server.post(appconfig.designer.mountPath + '/save-file', function saveFile(req, res) {
    fs.writeFile(req.body.file, req.body.data, function writeFileCbFn(err) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json({
          status: true
        });
      }
    });
  });

  server.get(appconfig.designer.mountPath + '/assets', function designerStyles(req, res) {
    res.json(module.assetData);
  });

  server.get(appconfig.designer.mountPath + '/assets/images', function designerStyles(req, res) {
    res.json(module.assetData.images);
  });

  server.get(appconfig.designer.mountPath + '/assets/videos', function designerStyles(req, res) {
    res.json(module.assetData.videos);
  });

  server.get(appconfig.designer.mountPath + '/assets/audios', function designerStyles(req, res) {
    res.json(module.assetData.audios);
  });

  server.get(appconfig.designer.mountPath + '/elements', function prospectElements(req, res) {
    res.json(module.prospectElements);
  });

  ifDirectoryExist(evfDesignerPath + '/evf-designer', function checkIfDirectoryExist(dirname, status) {
    if (status) {
      server.once('started', function evfDesignerServerStarted() {
        var baseUrl = server.get('url').replace(/\/$/, '');
        console.log('Browse Designer at %s%s', baseUrl, appconfig.designer.mountPath);
      });
    }
  });
}

function convertVerb(verb) {
  if (verb.toLowerCase() === 'all') {
    return 'POST';
  }

  if (verb.toLowerCase() === 'del') {
    return 'DELETE';
  }

  return verb.toUpperCase();
}

function ifDirectoryExist(dirname, cb) {
  fs.stat(dirname, function getDirectoryStats(err, stat) {
    var status = true;
    if (err) {
      status = false;
    }
    cb(dirname, status);
  });
}

module.exports = function EvfDesigner(server) {
  if (appconfig.enableDesigner) {
    var defaultConfig = {
      installationPath: 'client/bower_components',
      mountPath: '/designer',
      templatePath: [],
      stylePath: []
    };
    Object.assign(defaultConfig, appconfig.designer || {});
    appconfig.designer = defaultConfig;

    ifDirectoryExist(appconfig.designer.installationPath + '/evf-designer', function directorySearch(dirname, status) {
      if (status) {
        setEvfDesignerPath(appconfig.designer.installationPath, server);
      } else {
        console.warn('Designer not installed at [' + appconfig.designer.installationPath + '/evf-designer]');
      }
    });

    var designerUIMetadata = {
      'code': 'BaseUser',
      'modeltype': 'BaseUser',
      'title': 'Create User',
      'resturl': 'api/BaseUsers',
      'skipMissingProperties': true,
      'controls': [{
        'fieldid': 'username',
        'label': 'User Name',
        'required': true,
        'container': 'main'
      }, {
        'label': 'Email',
        'fieldid': 'email',
        'container': 'main',
        'autocomplete': 'off'
      }, {
        'label': 'Password',
        'fieldid': 'password',
        'required': true,
        'container': 'main',
        'uitype': 'text',
        'type': 'password',
        'autocomplete': 'off'
      }, {
        'fieldid': 'tenantId',
        'label': 'Tenant Id',
        'required': true,
        'container': 'main'
      }],
      id: '69f5a862-1434-402d-8ea9-b6b3406340cc'
    };

    var uiMetadataModel = loopback.findModel('UIMetadata');

    if (uiMetadataModel) {
      uiMetadataModel.create(designerUIMetadata, util.bootContext(), function results(err, result) {
        if (err) {
          log.debug(util.bootContext(), 'Unable to create UIMetadata record for BaseUser. Record may have already exist.', err);
          return;
        }
      });
    }
  }
};
