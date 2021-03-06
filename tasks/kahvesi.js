/*
 * grunt-kahvesi
 * https://github.com/tonylukasavage/grunt-kahvesi
 *
 * Copyright (c) 2014 Tony Lukasavage
 * Licensed under the MIT license.
 */

'use strict';

var exec = require('child_process').exec,
	format = require('util').format,
	path = require('path');

var istanbulBin = require.resolve('istanbul/' + require('istanbul/package.json').bin.istanbul)
var mochaBin = require.resolve('mocha/' + require('mocha/package.json').bin.mocha)

var BIN = path.join(__dirname, '..', 'node_modules', '.bin');

module.exports = function(grunt) {

	grunt.registerMultiTask('kahvesi', 'grunt plugin for generating istanbul + mocha coverage reports', function() {
		var done = this.async(),
			options = this.options({ report: 'lcov' }),
			istanbul = quote(istanbulBin),
			mocha = quote(mochaBin),
			files = this.filesSrc.reduce(function(p,c) { return (p || '') + ' "' + c + '" '; }),
			excludes = ['**/node_modules/**', '**/test/mocha/test/**'],
			args = process.env.KAHVESI_TEST ? '--no-default-excludes -x ' + quote(excludes.join(' ')) : '',
			reporter = options.reporter || 'min';

		delete options.reporter;
		var opts = Object.keys(options).map(function(key) {
			var opt, value = options[key];
			opt = key.length === 1 ? '-' + key : '--' + key;
			value = value === true || value === false ? '' : '"' + value + '"';
			return opt + ' ' + value;
		}).join(' ');

		var cmd = format('%s cover %s %s %s -- -R spec -t 10000 %s', istanbul, opts, args, mocha, files);
		grunt.log.debug(cmd);
		var child = exec(cmd);

		child.stdout.on('data', function(data) {
			process.stdout.write(data);
		});
		child.stderr.on('data', function(data) {
			process.stderr.write(data);
			if (/failing/.test(data)) {
				grunt.fail.fatal(data);
			}
		});
		child.on('close', function(code) {
			if(code === 0) {
				grunt.log.ok('Test coverage report generated');
			} else {
				grunt.fail.warn('No coverage information was collected. Report not generated.');
			}
			done();
		});
	});

};

function quote(str) { return '"' + str + '"'; }
