
var q = require('q');
var prompt = require('prompt');
prompt.message = "Stash Build Configuration".magenta;
prompt.delimiter = ":";

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
            process: {
                description: "Process as it would be entered on command line eg. `npm test`".blue,
                required: true,
                default: 'npm-test'
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


var projectConfFile = 'stash-build.json';

var getProject = function(){

    try {
        return require(process.cwd()+'/'+projectConfFile);
    }catch(e){
        return false;
    }
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