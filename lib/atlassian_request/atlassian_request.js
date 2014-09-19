var request = require('request');
var q = require('q');

var atlassianRequest = function(atlassianUrl, credentials, method, url, json){

    var deferred = q.defer();

    var config = {
        uri: atlassianUrl+url,
        method: method,
        headers: {
            'Accept': 'application/json'
        }
    };

    if (!!json){
        config.json = json;
    }

    request(config, function (error, response) {

        if (!error && String(response.statusCode).substr(0,1) === '2') { //no error and status code starts with 2
            deferred.resolve(response);
        }else{
            console.log('response', response);
            deferred.reject({error:error, response:response});
        }
    }).auth(credentials.username, credentials.password, true);

    return deferred.promise;
};

var stashRequest = function(stashDetails, method, url, json){

    return atlassianRequest(stashDetails.stashUrl, stashDetails, method, url, json);
};

var jiraRequest = function(jiraDetails, method, url, json){

    return atlassianRequest(jiraDetails.jiraUrl, jiraDetails, method, url, json);
};

var checkCredentials = function(stashDetails){
    return stashRequest(stashDetails, 'GET', '/rest/api/1.0/users/'+stashDetails.username);
};

var postBuildStatus = function(stashDetails, buildResult){

    var stashBuildObj = {
        state: "INPROGRESS", //INPROGRESS|SUCCESSFUL|FAILED
        key: buildResult.buildConf.key,
        name: buildResult.buildConf.process,
        url: "http://example.com",
        description: ""//buildResult.reason
    };

    if (buildResult.state ==='rejected'){
        stashBuildObj.state = 'FAILED';
    }

    if (buildResult.state ==='fulfilled'){
        stashBuildObj.state = 'SUCCESSFUL';
    }

    var commitHash = buildResult.commitObj.commit.commit;

    return stashRequest(stashDetails, 'POST', '/rest/build-status/1.0/commits/'+commitHash, stashBuildObj);
};


var postBuildResults = function(stashDetails, results){ //post build to stash

    var postPromises = [];

    console.log('Posting build results');

    results.forEach(function(result){
        console.log('added post promise');
        postPromises.push(postBuildStatus(stashDetails, result));

    });

    return q.allSettled(postPromises);

};

var buildLogMessage = function(buildResults, commitDetails){

    var message = "h3. Build created\n";
    message += "*Commit*: "+commitDetails.commit+"\n";
    message += "*Author*: "+commitDetails.author+"\n";
    message += "*Message*: "+commitDetails.message+"\n";

    buildResults.forEach(function(buildResult){

        message += "h4. Build Output: \n";
        message += "*Key*: "+buildResult.buildConf.key+"\n";
        message += "*Process*: "+buildResult.buildConf.process+"\n";
        message += "*Output*: {code}"+buildResult.value+"{code}\n";

    });


    return message;

};

var logBuildStatus = function(jiraDetails, buildResults, commitDetails){

    var jiraCommentObj = {
        body: buildLogMessage(buildResults, commitDetails.commit),
        visibility: {
            type : "role",
            value : "Developers"
        }
    };

    var jiraIssueKey = commitDetails.branch;

    return jiraRequest(jiraDetails, 'POST', '/rest/api/2/issue/'+jiraIssueKey+'/comment?expand', jiraCommentObj);
};

var logBuildResults = function(stashDetails, results){ //log build in jira
    
    console.log('logBuildResults', results);

    var commitDetails = results[0].commitObj;


    return logBuildStatus(stashDetails, results, commitDetails);
    
};

module.exports = {
    checkCredentials: checkCredentials,
    postBuildStatus: postBuildStatus,
    postBuildResults: postBuildResults,
    logBuildResults: logBuildResults
};