var q = require('q');
var git    = require('gitty');
var repo = git('.');
var cli = require('../cli/cli');


var checkGit = function(force){

    force = force || false;

    cli.out(2, "Checking git status".cyan);

    var deferred = q.defer();

    if (force){

        deferred.resolve("Forced");

    }else{

        repo.status(function(err, status){

            deferred.notify("Checking git status");

            if (err){
                deferred.reject(err);
                return false;
            }

            if (status.staged.length > 0){
                deferred.reject("Git error: There are staged changes");
            }else if (status.unstaged.length > 0){
                deferred.reject("Git error: There are unstaged changes");
            }else if (status.untracked.length > 0){
                deferred.reject("Git error: There are untracked changes");
            }else{
                deferred.resolve(status);
            }

        });

    }

    return deferred.promise;

};


var getCommit = function(force){

    return checkGit(force).then(function(){

        var deferred = q.defer();

        var gitInfo = {
            branch: null,
            commit: null
        };

        q.nfcall(repo.getBranches)
            .then(function(branches) {

                gitInfo.branch = branches.current;

                cli.out(2, "Retrieved current branch".cyan, gitInfo.branch);

                q.nfcall(repo.log)
                    .then(function(log){

                        gitInfo.commit = log[0];

                        cli.out(2, "Retrieved latest commit".cyan, gitInfo.commit);

                        deferred.resolve(gitInfo);
                    });

            })
        ;


        return deferred.promise;

    }).fail(function(output){
        cli.error(new Error(output), 1);
    });

};


module.exports = {
    getCommit: getCommit
};