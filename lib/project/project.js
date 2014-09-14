
var q = require('q');
var prompt = require('prompt');
prompt.message = "Stash Build Configuration".magenta;
prompt.delimiter = ":";

var getProjectBuild = function(cbf){

    prompt.start();

    var schema = {
        properties: {
            key: {
                description: "Enter build key (a unique name for your build process eg `postman`".blue,
                pattern: /^[a-zA-Z\s\-]+$/,
                message: 'Key must be only letters, spaces, or dashes',
                required: true,
                default: 'my-build'
            },
            process: {
                description: "Process as it would be entered on command line eg. `npm test`".blue,
                required: true,
                default: 'npm-test'
            }
        }
    };

    var continueSchema = {
        properties: {
            choice: {
                description: "Do you wish to create another build process?".blue,
                pattern: /^[yn]$/,
                message: 'Only enter `y` or `n`',
                required: true,
                default: 'y'
            }
        }
    };

    prompt.get(schema, function (buildErr, buildConf) {

        if (buildErr){
            cbf(buildErr, null);
            return false;
        }

        prompt.get(continueSchema, function(err, result){

            if (err){
                cbf(err, null);
                return false;
            }

            var res = {
                buildConf: buildConf,
                buildAnother: false
            };

            if (result.choice === 'y'){
                res.buildAnother = true;
            }

            cbf(buildErr, res);

        });

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

    return q.nfcall(addBuildConf, []);

};


var projectConfFile = 'stash-build.json';

var getProject = function(){
    return require(projectConfFile);
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
    init: init
};