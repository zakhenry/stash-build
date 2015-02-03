
var q = require('q');
var prompt = require('prompt');
var path = require('path');
var _ = require('lodash');
var cli = require('../cli/cli');

prompt.message = "Stash Build Configuration".cyan;
prompt.delimiter = ":";

var projectConfFile = 'stash-build.json';
var exec = require('child_process').exec;
var Project = function(conf){

    this.build = function(commitObj){

        var deferred = q.defer();

        if (!_.isArray(conf) || conf.length === 0){
            deferred.reject(new Error("Invalid configuration"));
        }

        var buildPromises = [];

        conf.forEach(function(build){

            var dir = path.resolve(process.cwd(), build.directory || './');

            var deferredBuild = q.defer();

            cli.out(0, ("Building "+ build.key + '...').cyan);
            cli.out(2, "Build config", build);

            exec(build.process, {
                cwd: dir
            }, function(err, stdout, stderr){
                if (err !== null) {
                    cli.out(0, ("Build failed ("+build.key+") ").red+"Output follows:".cyan);
                    deferredBuild.reject(stderr);
                    cli.out(0, stderr.grey);
                }else{
                    cli.out(0, ("Build passed "+build.key).green);
                    deferredBuild.resolve(stdout);
                }
            });

            buildPromises.push(deferredBuild.promise);

        });

        q.allSettled(buildPromises).then(
            function(results){

                results.forEach(function(result, index){
                    result.buildConf = conf[index];
                    result.commitObj = commitObj;
                });

                deferred.resolve(results);
            }
        );

        return deferred.promise;

    };
};

var getProject = function(){

    var conf;
    try {
        conf = require(process.cwd()+'/'+projectConfFile);
    }catch(e){
        return false;
    }

    var project = new Project(conf);

    return project;

};

var promptConfirm = function(description){

    var deferred = q.defer();

    var continueSchema = {
        properties: {
            choice: {
                description: description,
                pattern: /^[yn]$/,
                message: 'Only enter `y` or `n`',
                required: true,
                default: 'n'
            }
        }
    };

    prompt.get(continueSchema, function(err, result){

        if (err){
            deferred.reject(err);
        }

        if (result.choice === 'y'){
            deferred.resolve();
        }else{
            deferred.reject();
        }

    });

    return deferred.promise;

};

var getProjectBuild = function(cbf){

    prompt.start();

    var schema = {
        properties: {
            key: {
                //@todo check for duplicate keys
                description: "Enter build key (a unique name for your build process eg `postman`".blue,
                pattern: /^[a-zA-Z\s\-]+$/,
                message: 'Key must be only letters, spaces, or dashes',
                required: true,
                default: 'my-node-build'
            },
            name: {
                description: "A name for your test. `Node test`".blue,
                required: true,
                default: 'Node test'
            },
            process: {
                description: "Process as it would be entered on command line eg. `npm test`".blue,
                required: true,
                default: 'npm-test'
            },
            directory: {
                description: "Directory that the test should be run from eg `./app/`".blue,
                required: true,
                default: './'
            }
        }
    };

    prompt.get(schema, function (buildErr, buildConf) {

        if (buildErr){
            cbf(buildErr, null);
            return false;
        }

        var res = {
            buildConf: buildConf,
            buildAnother: false
        };

        promptConfirm("Do you wish to create another build process?".blue).then(
            function(){
                res.buildAnother = true;
                cbf(null, res);
            },
            function(){
                cbf(null, res);
            }
        );


    });

};

var addBuildConf = function(allBuilds, cbf){


    getProjectBuild(function(err, result){

        if (err){
            cbf(err, null);
            return false;
        }

        allBuilds.push(result.buildConf);

        if (result.buildAnother === true){
            addBuildConf(allBuilds, cbf); //recursion
        }else{
            cbf(null, allBuilds);
        }

    });

};

var buildProjectConf = function(){

    var existing = getProject();

    var buildConfPromise = q.nfcall(addBuildConf, []);

    if (existing){
        //@todo check confirm with the user that they want to overwrite
//        return promptConfirm("You already have a project config file, do you wish to overwrite it?").then(function(){
//            return buildConfPromise;
//        });
    }

    return buildConfPromise;

};







var saveProjectConf = function(projectConf){

    var fs = require('fs');

    var deferred = q.defer();

    var file = projectConfFile;

    fs.writeFile(file, JSON.stringify(projectConf, null, 4), function(err) {
        if(err) {
            deferred.reject(err);
        } else {
            deferred.resolve("Project Config saved to " + file);
        }
    });

    return deferred.promise;

};


var init = function(){

    return buildProjectConf()
        .then(saveProjectConf)
        .then(function(success){
            return success;
        })
        .fail(
            function(error){
                throw new Error(error);
            }
        );

};

module.exports = {
    init: init,
    get: getProject
};