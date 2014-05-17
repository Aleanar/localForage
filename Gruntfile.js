/* jshint node:true */
var path = require('path');
var saucelabsBrowsers = require(path.resolve('test', 'saucelabs-browsers.js'));

var sourceFiles = [
    'Gruntfile.js',
    'src/*.js',
    'src/**/*.js',
    'test/**/test.*.js'
];

var testURLs = [
    'http://localhost:9999/test/test.main.html',
    'http://localhost:9999/test/test.component.html'
];

module.exports = exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        concat: {
            options: {
                separator: '',
            },
            localforage: {
                src: [
                    // https://github.com/jakearchibald/es6-promise
                    'bower_components/es6-promise/promise.js',
                    'src/drivers/**/*.js',
                    'src/localforage.js'
                ],
                dest: 'dist/localforage.js',
                options: {
                    banner:
                        '/*!\n' +
                        '    localForage -- Offline Storage, Improved\n' +
                        '    Version 0.8.1\n' +
                        '    http://mozilla.github.io/localForage\n' +
                        '    (c) 2013-2014 Mozilla, Apache License 2.0\n' +
                        '*/\n'
                }
            }
        },
        connect: {
            'cross-origin': {
                options:{
                    base: '.',
                    hostname: '*',
                    port: 9998
                }
            },
            test: {
                options:{
                    base: '.',
                    hostname: '*',
                    port: 9999
                }
            }
        },
        jscs: {
            source: sourceFiles
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            source: sourceFiles
        },
        mocha: {
            unit: {
                options: {
                    urls: testURLs
                }
            }
        },
        open: {
            site: {
                path: 'http://localhost:4567/'
            }
        },
        'saucelabs-mocha': {
            all: {
                options: {
                    username: process.env.SAUCE_USERNAME,
                    key: process.env.SAUCE_ACCESS_KEY,
                    urls: testURLs,
                    tunnelTimeout: 5,
                    build: process.env.TRAVIS_JOB_ID,
                    concurrency: 3,
                    browsers: saucelabsBrowsers,
                    testname: 'localForage Tests'
                }
            }
        },
        shell: {
            options: {
                stdout: true
            },
            component: {
                command: path.resolve('node_modules', 'component', 'bin',
                                      'component-build') +
                         ' -o test -n localforage.component'
            },
            'publish-site': {
                command: 'rake publish ALLOW_DIRTY=true'
            },
            'serve-site': {
                command: 'bundle exec middleman server'
            }
        },
        uglify: {
            localforage: {
                files: {
                    'dist/localforage.min.js': ['dist/localforage.js'],
                    'site/localforage.min.js': ['dist/localforage.js']
                }
            }
        },
        watch: {
            build: {
                files: ['src/*.js', 'src/**/*.js'],
                tasks: ['build']
            },
            /*jshint scripturl:true */
            'mocha:unit': {
                files: ['dist/localforage.js', 'test/test.*.*', ],
                tasks: ['jshint', 'jscs', 'shell:component', 'mocha:unit']
            }
        }
    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('default', ['build', 'connect:test', 'watch']);
    grunt.registerTask('build', ['concat', 'uglify']);
    grunt.registerTask('publish', ['build', 'shell:publish-site']);
    grunt.registerTask('serve', ['build', 'connect:test', 'watch']);
    grunt.registerTask('site', ['shell:serve-site']);

    // These are the test tasks we run regardless of Sauce Labs credentials.
    var testTasks = [
        'build',
        'jshint',
        'jscs',
        'shell:component',
        'connect:test',
        'mocha'
    ];
    grunt.registerTask('test:local', testTasks.slice());

    // Run tests using Sauce Labs if we are on Travis or have locally
    // available Sauce Labs credentials. Use `grunt test:local` to skip
    // Sauce Labs tests.
    if (process.env.TRAVIS_JOB_ID ||
        (process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY)) {
        testTasks.push('saucelabs-mocha');
    }

    grunt.registerTask('test', testTasks);
};
