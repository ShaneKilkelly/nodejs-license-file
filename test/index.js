'use strict';

/**
 * Should library
 *
 * @type {should|exports|module.exports}
 */
var should = require('should');

/**
 * Core fs module
 *
 * @type {exports|module.exports}
 */
var fs = require('fs');

/**
 * LicenseFile module
 *
 * @type {Generator|exports|module.exports}
 */
var licenseFile = require('../index');

/**
 * Some varants
 */
var LICENSE_VERSION     = '1';
var APPLICATION_VERSION = '1.0.0';
var FIRST_NAME          = 'First Name';
var LAST_NAME           = 'Last Name';
var EMAIL               = 'some@email.com';
var EXPIRATION_DATE     = '2025/09/25';

describe('Generate license file', function() {

  it('with default template', function(done) {
        licenseFile.generate({
            privateKeyPath: 'test/keys/key.pem',
            data: 'data string'
        }, function(err, fileData) {
            should.equal(err, null);

            fileData.should.match(/^====BEGIN LICENSE====\ndata string\n(.*)\n=====END LICENSE=====$/);

            fs.writeFileSync('test/1.lic', fileData, 'utf8');

          done();
        });
    });

    it('with custom template',function(done) {

        var template = [
            '====BEGIN LICENSE====',
            '{{&licenseVersion}}',
            '{{&applicationVersion}}',
            '{{&firstName}}',
            '{{&lastName}}',
            '{{&email}}',
            '{{&expirationDate}}',
            '{{&serial}}',
            '=====END LICENSE====='
        ].join('\n');

        licenseFile.generate({
            template: template,
            privateKeyPath: 'test/keys/key.pem',
            data: {
                licenseVersion: LICENSE_VERSION,
                applicationVersion: APPLICATION_VERSION,
                firstName: FIRST_NAME,
                lastName: LAST_NAME,
                email: EMAIL,
                expirationDate: EXPIRATION_DATE
            }
        },function(err, fileData)  {
            should.equal(err, null);

            var regExp = new RegExp('^====BEGIN LICENSE====\\n' +
                LICENSE_VERSION + '\\n' +
                APPLICATION_VERSION + '\\n' +
                FIRST_NAME + '\\n' +
                LAST_NAME + '\\n' +
                EMAIL + '\\n' +
                EXPIRATION_DATE + '\\n(.*)\\n=====END LICENSE=====$');

            fileData.should.match(regExp);

            fs.writeFileSync('test/2.lic', fileData, 'utf8');

            done()
        });
    });
});

describe('Parse license files',function()  {

    it('with default template',function(done) {
        licenseFile.parse({
            publicKeyPath: 'test/keys/key.pub',
            fileData: fs.readFileSync('test/1.lic', 'utf8')
        },function(err, data)  {
            should.equal(err, null);

            data.valid.should.be.ok();
            data.data.should.be.eql('data string');

            done();
        });
    });

    it('with default template (bad license file)',function(done) {

        var fileData = fs.readFileSync('test/1.lic', 'utf8').replace(/data string/g, 'another one data string');

        licenseFile.parse({
            publicKeyPath: 'test/keys/key.pub',
            fileData: fileData
        },function(err, data)  {
            should.equal(err, null);

            data.valid.should.not.be.ok();

            done();
        });
    });

    it('with custom template',function(done) {
        licenseFile.parse({
            publicKeyPath: 'test/keys/key.pub',
            fileData: fs.readFileSync('test/2.lic', 'utf8'),
            fileParseFnc:function(fileData, callback)  {
                var dataLines = fileData.split('\n');

                if (dataLines.length != 9) {
                    return callback(new Error('LicenseFile::fileParseFnc: License file must have 5 lines, actual: ' + dataLines.length));
                }

                var licenseVersion     = dataLines[1];
                var applicationVersion = dataLines[2];
                var firstName          = dataLines[3];
                var lastName           = dataLines[4];
                var email              = dataLines[5];
                var expirationDate     = dataLines[6];
                var serial             = dataLines[7];

                callback(null, {
                    serial: serial, data: {
                        licenseVersion: licenseVersion,
                        applicationVersion: applicationVersion,
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        expirationDate: expirationDate
                    }
                });
            }
        },function(err, data)  {
            should.equal(err, null);

            data.valid.should.be.ok();
            data.data.licenseVersion.should.be.eql(LICENSE_VERSION);
            data.data.applicationVersion.should.be.eql(APPLICATION_VERSION);
            data.data.firstName.should.be.eql(FIRST_NAME);
            data.data.lastName.should.be.eql(LAST_NAME);
            data.data.email.should.be.eql(EMAIL);
            data.data.expirationDate.should.be.eql(EXPIRATION_DATE);

            done();
        });
    });

    it('with custom template (bad license file)',function(done) {

        var fileData = fs.readFileSync('test/2.lic', 'utf8').replace(/2025\/09\/25/g, '2045/09/25');

        licenseFile.parse({
            publicKeyPath: 'test/keys/key.pub',
            fileData: fileData,
            fileParseFnc:function(fileData, callback)  {
                var dataLines = fileData.split('\n');

                if (dataLines.length != 9) {
                    return callback(new Error('LicenseFile::fileParseFnc: License file must have 5 lines, actual: ' + dataLines.length));
                }

                var licenseVersion     = dataLines[1];
                var applicationVersion = dataLines[2];
                var firstName          = dataLines[3];
                var lastName           = dataLines[4];
                var email              = dataLines[5];
                var expirationDate     = dataLines[6];
                var serial             = dataLines[7];

                callback(null, {
                    serial: serial, data: {
                        licenseVersion: licenseVersion,
                        applicationVersion: applicationVersion,
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        expirationDate: expirationDate
                    }
                });
            }
        },function(err, data)  {
            should.equal(err, null);

            data.valid.should.not.be.ok();

            done();
        });
    });
});

describe('Clean',function()  {
    it('license files',function(done) {
        fs.unlinkSync('test/1.lic');
        fs.unlinkSync('test/2.lic');
        done();
    });
});
