/**
 * 
 * ©2016-2017 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 * 
 */
var postgresHost = process.env.POSTGRES_HOST || 'localhost';
// var mongoHost = process.env.MONGO_HOST || 'localhost';
module.exports = {
  'nullsrc': {
    'name': 'nullsrc',
    'connector': 'memory'
  },
  'transient': {
    'name': 'transient',
    'connector': 'transient'
  },
  'db': {
    'host': postgresHost,
    'port': 5432,
    'url': 'postgres://postgres:postgres@' + postgresHost + ':5432/db',
    'database': 'db',
    'password': 'postgres',
    'name': 'db',
    'connector': 'loopback-connector-evpostgresql',
    'user': 'postgres',
    'connectionTimeout': 50000
  },
  'emailDs': {
    'name': 'emailDs',
    'connector': 'mail',
    'transports': [{
      'type': 'smtp',
      'host': 'smtp.gmail.com',
      'port': 587,
      'auth': {
        'user': 'yourGmailAccount@gmail.com',
        'pass': 'yourSecretPassword'
      }
    }]
  },
  'gridfs_db': {
    'name': 'gridfs_db',
    'connector': 'loopback-component-storage',
    'provider': 'filesystem',
    'root': './'
  }
};
