/*
 * nodejs-license-file
 * https://github.com/bushev/nodejs-license-file
 *
 * Copyright (c) 2016 Yuriy Bushev
 * Licensed under the MIT license.
 */

'use strict';

/**
 * Core fs module
 *
 * @type {exports|module.exports}
 */
var fs = require('fs');

/**
 * Core path module
 *
 * @type {posix|exports|module.exports}
 */
var path = require('path');

/**
 * Core crypto module
 *
 * @type {exports|module.exports}
 */
var crypto = require('crypto');

/**
 * Template library
 *
 * @type {exports|module.exports}
 */
var mustache = require('mustache');

/**
 * Default license file template
 */
var defaultTemplate = fs.readFileSync(path.resolve(__dirname, '..', 'data', 'default.tpl'), 'utf8');

/**
 * LicenseFile Class
 */
var LicenseFile = {

    /**
     *  Generate license file
     *
     * @param options
     * @param options.data {object|string} - data to sign
     * @param options.privateKeyPath {string} - path to private key
     * @param [options.template] - custom license file template
     * @param callback {function} - callback function
     */
  generate: function(options, callback) {

        if (!options.data) {
            return callback(new Error('LicenseFile::generate: options.data is required'));
        }

        if (typeof options.privateKeyPath != 'string') {
            return callback(new Error('LicenseFile::generate: options.privateKeyPath is required'));
        }

        if (typeof callback != 'function') {
            return callback(new Error('LicenseFile::parse: callback is required'));
        }

        var template = (typeof options.template == 'string') ? options.template : defaultTemplate;

        var serial = LicenseFile._generateSerial(options);

        if (typeof options.data == 'string') {
            options.data = {string: options.data};
        }

        options.data.serial = serial;

        return callback(null, mustache.render(template, options.data));
  },

    /**
     * Parse license file
     *
     * @param options
     * @param options.publicKeyPath {string} - path to public key
     * @param options.fileData {string} - license file content
     * @param [options.fileParseFnc] {function} - file parse function
     * @param callback
     */
  parse: function(options, callback) {

        if (typeof options.publicKeyPath != 'string') {
            return callback(new Error('LicenseFile::parse: options.publicKeyPath is required'));
        }

        if (typeof options.fileData != 'string') {
            return callback(new Error('LicenseFile::parse: options.fileData is required'));
        }

        if (typeof options.fileParseFnc != 'function') {
            options.fileParseFnc = LicenseFile._defaultFileParseFnc;
        }

        if (typeof callback != 'function') {
            return callback(new Error('LicenseFile::parse: callback is required'));
        }

        return options.fileParseFnc(options.fileData,function(err, parsedData)  {
            if (err) return callback(err);

            if (typeof parsedData.serial != 'string') {
                return callback(new Error('LicenseFile::fileParseFnc: serial string was not passed to callback'));
            }

            if (typeof parsedData.data != 'string' && typeof parsedData.data != 'object') {
                return callback(new Error('LicenseFile::fileParseFnc: data string/object was not passed to callback'));
            }

            var data   = parsedData.data;
            var verify = crypto.createVerify('RSA-SHA256');

            if (typeof data == 'object') {
                data = JSON.stringify(data);
            }

            verify.update(data);

            var valid = verify.verify(fs.readFileSync(options.publicKeyPath), parsedData.serial, 'base64');

            return callback(null, {valid: valid, serial: parsedData.serial, data: parsedData.data});
        });
  },

    /**
     *
     * @param options
     * @param options.data
     * @param options.privateKeyPath
     * @private
     */
  _generateSerial: function(options) {

        var sign        = crypto.createSign('RSA-SHA256');
        var data          = options.data;
        var private_key = fs.readFileSync(options.privateKeyPath);

        if (typeof options.data == 'object') {
            data = JSON.stringify(options.data);
        }

        sign.update(data);

        return sign.sign(private_key, 'base64');
  },

  _defaultFileParseFnc: function(fileData, callback) {

        var dataLines = fileData.split('\n');

        if (dataLines.length != 4) {
            return callback(new Error('LicenseFile::_defaultFileParseFnc: License file must have 4 lines'));
        }

        var data   = dataLines[1];
        var serial = dataLines[2];

        return callback(null, {serial: serial, data: data});
    }
};

/**
 * Export LicenseFile Class
 *
 * @type {LicenseFile}
 */
module.exports = LicenseFile;
