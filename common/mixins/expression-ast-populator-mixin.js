/**
 * 
 * ©2016-2017 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 * 
 */
/**
 * This mixin is for expression language, where we collect all the grammar rules attached to the model
 * and create their ASTs.All the ASTs are attached to the model in the object "_ast".
 * "_ast" takes the expression as key and its AST as the value.
 * @mixin Expression ast Populator Mixin
 * @author Sambit Kumar Patra
 */

var logger = require('../../lib/logger');
var log = logger('expression-ast-populator-mixin');
var exprLang = require('../../lib/expression-language/expression-language.js');

module.exports = function ExpressionAstPopulator(Model) {
  Model._ast = {};
  log.info(log.defaultContext(), 'building AST for   ', Model.modelName);
  var properties = Model.definition.properties;
  // process all the validateWhen grammar rules at property level and attach their ASTs to the model
  Object.keys(properties).forEach(function propertiesForEachCb(propertyName) {
    Object.keys(properties[propertyName]).forEach(function propertyNameForEachCb(key) {
      if (properties[propertyName].validateWhen && properties[propertyName].validateWhen[key]) {
        // pick the validateWhen condition if present for the validation rule
        var validateWhenRule = properties[propertyName].validateWhen[key];
        Model._ast[validateWhenRule] = exprLang.createAST(validateWhenRule);
        log.info(log.defaultContext(), 'validateWhen ast building for   ', key, ' rule of ', Model.modelName, '->', propertyName);
      }
      // this is for property expressions which will be evaluated and assigned to property
      if (properties[propertyName].propExpression) {
        log.info(log.defaultContext(), 'applying expression to property name ', propertyName, ' for model ', Model.modelName);
        var propExpression = properties[propertyName].propExpression;
        Model._ast[propExpression] = exprLang.createAST(propExpression);
      }
    });
  });

  var evVvalidations = Model.definition.settings.evValidations || {};

  // process all the grammar rules present in evValidations and and attach their ASTs to the model
  Object.keys(evVvalidations).forEach(function validationsForEachCb(evValidationName) {
    var evValidationRule = evVvalidations[evValidationName];
    // if evValidation has a validateWhen condition then pick it up and create AST for it
    if (evValidationRule.validateWhen) {
      // validateWhen takes a string in case of ev validations
      if (typeof evValidationRule.validateWhen === 'string') {
        // pick the validateWhen condition and attach its AST to the model
        var validateWhenRule = evValidationRule.validateWhen;
        Model._ast[validateWhenRule] = exprLang.createAST(validateWhenRule);
        log.info(log.defaultContext(), 'validateWhen ast building for evValidation rule   ', Model.modelName, '->', evValidationName);
      }
    }
    // if the evValidation is of 'custom' type then pick its expression which a grammar rule and create AST for that expression
    if (evValidationRule.type === 'custom') {
      var expression = evValidationRule.expression;
      // pick the expression for custom type evValidation and attach its AST to the model
      Model._ast[expression] = exprLang.createAST(expression);
      log.info(log.defaultContext(), 'ast building for evValidation custom rule   ', Model.modelName, '->', evValidationName);
    }
  });

  var otpEnabledMethods = Model.definition.settings.evEnableOTP || [];
  otpEnabledMethods.forEach(function otpMethodIterate(otpConfig) {
    var expression = otpConfig.authWhen;
    if (expression) {
      Model._ast[expression] = exprLang.createAST(expression);
    }
  });
};
