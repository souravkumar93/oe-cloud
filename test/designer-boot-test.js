/**
 * 
 * ©2016-2017 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 * 
 */
/*global
    require,before,after,it,describe
*/
var chalk = require('chalk');
var bootstrap = require('./bootstrap');
var expect = bootstrap.chai.expect;
var models = bootstrap.models;
var defaults = require('superagent-defaults');
var supertest = require('supertest');
var adminContext = {
    ctx : {
        tenantId: 'default',
        remoteUser: 'admin'
    }
};
var app = bootstrap.app;

/** 
 * @Author : Rohit
 * Designer Boot Test cases : This test will perform following
 * 1. When enableDesigner is true, /designer path is added to serve designer
 * 2. /designer/config returns designer config data
 * 3. /designer/templates returns the templates data
 * **/


describe(chalk.blue('designer routes'), function () {
    
    var accessToken;
    var testUserToken;
    var adminAccessToken;
   
    before('Login to EVF as admin', function (done) {
        bootstrap.login({ 'username': 'admin', 'password' : 'admin' }, function (token) {
            accessToken = token;
            adminAccessToken = token;
            return done();
        });
    });
    
    after('cleanup', function (done) {
        done();
    });
    
    it('should add /designer route to serve designer', function (done) {
        var api = defaults(supertest(bootstrap.app));
        var designerUrl = '/designer?access_token=' + accessToken;
        api.set('Accept', 'application/json')
        .get(designerUrl)
        .end(function (err, resp) {
            expect(resp.status).to.be.equal(200);
            done(err);
        });
    });
    
    it('should add /designer/config route to serve designer config', function (done) {
        var api = defaults(supertest(bootstrap.app));
        var designerUrl = '/designer/config?access_token=' + accessToken;
        api.set('Accept', 'application/json')
        .get(designerUrl)
        .end(function (err, resp) {
            expect(resp.status).to.be.equal(200);
            expect(resp.body).to.have.property('mountPath').that.is.a('string');
            expect(resp.body.mountPath).to.equal('/designer');
            expect(resp.body).to.have.property('installationPath').that.is.a('string');
            expect(resp.body).to.have.property('templatePath').that.is.an('array');
            done(err);
        });
    });

    it('should add /designer/templates route to serve designer templates', function (done) {
        var api = defaults(supertest(bootstrap.app));
        var designerUrl = '/designer/templates?access_token=' + accessToken;
        api.set('Accept', 'application/json')
        .get(designerUrl)
        .end(function (err, resp) {
            expect(resp.status).to.be.equal(200);
            expect(resp.body).to.be.an('array');
            var formTpl = resp.body.find(function(i){return i.file === 'default-form.html';});
            var pageTpl = resp.body.find(function(i){return i.file === 'default-page.html';});
            expect(formTpl).to.be.ok;
            expect(formTpl.type).to.equal('component');
            expect(pageTpl).to.be.ok;
            expect(pageTpl.type).to.equal('html');
            done(err);
        });
    });
    it('should add /designer/styles route to serve designer styles', function (done) {
        var api = defaults(supertest(bootstrap.app));
        var designerUrl = '/designer/styles?access_token=' + accessToken;
        api.set('Accept', 'application/json')
        .get(designerUrl)
        .end(function (err, resp) {
            expect(resp.status).to.be.equal(200);
            expect(resp.body).to.be.an('array');
            var styleRecord = resp.body.find(function(i){return i.file === 'default-theme.css';});
            expect(styleRecord).to.be.ok;
            done(err);
        });
    });
});





