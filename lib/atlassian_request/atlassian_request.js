var request = require('request');
var q = require('q');
var cli = require('../cli/cli');

var atlassianRequest = function(atlassianUrl, credentials, method, url, json){

    cli.out(2, "Initialising Atlassian request");

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
            cli.out(2, 'Atlassian Response success'.green);
            deferred.resolve(response);
        }else{
            cli.out(2, "Atlassian Response error".red);
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
    cli.out(1, "Checking credentials with Stash");
    return stashRequest(stashDetails, 'GET', '/rest/api/1.0/users/'+stashDetails.username);
};

var postBuildStatus = function(stashDetails, buildResult, commentLink){

    var stashBuildObj = {
        state: "INPROGRESS", //INPROGRESS|SUCCESSFUL|FAILED
        key: buildResult.buildConf.key,
        name: buildResult.buildConf.name,
        url: commentLink,
        description: buildResult.buildConf.process
    };

    if (buildResult.state ==='rejected'){
        stashBuildObj.state = 'FAILED';
    }

    if (buildResult.state ==='fulfilled'){
        stashBuildObj.state = 'SUCCESSFUL';
    }

    var commitHash = buildResult.commitObj.commit.commit;

    cli.out(1, "Posting build result to stash");

    return stashRequest(stashDetails, 'POST', '/rest/build-status/1.0/commits/'+commitHash, stashBuildObj);
};


var postBuildResults = function(stashDetails, results, commentLink){ //post build to stash

    var postPromises = [];

    cli.out(0, 'Posting build results to Stash...');

    results.forEach(function(result){
        cli.out(2, 'Added post promise');
        postPromises.push(postBuildStatus(stashDetails, result, commentLink));

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
        message += "*Name*: "+buildResult.buildConf.name+"\n";
        message += "*Key*: "+buildResult.buildConf.key+"\n";
        message += "*Process*: "+buildResult.buildConf.process+"\n";
        message += "*Output*: {code}"+buildResult.value+"{code}\n";

    });

    cli.out(2, "Created log message", message);

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

    var jiraIssueKey;
    if (cli.program.jirakey){
        jiraIssueKey = cli.program.jirakey;
    }else{
        jiraIssueKey = commitDetails.branch;
    }

    cli.out(0, "Posting build log to JIRA...");
    cli.out(2, "Jira comment config", jiraCommentObj);

    return validateJiraIssueKey(jiraDetails, jiraIssueKey)
        .fail(function(err){
            cli.out(2, err);
            cli.error(new Error("Invalid JIRA issue key - "+jiraIssueKey), 1);
        })
        .then(jiraRequest(jiraDetails, 'POST', '/rest/api/2/issue/'+jiraIssueKey+'/comment?expand', jiraCommentObj))
    ;

};

var logBuildResults = function(stashDetails, results){ //log build in jira
    
    var commitDetails = results[0].commitObj;

    return logBuildStatus(stashDetails, results, commitDetails);
    
};

var validateJiraIssueKey = function(jiraDetails, issueKey){
    return jiraRequest(jiraDetails, 'HEAD', '/rest/api/2/issue/'+issueKey);
};

var getJiraIssueCommentLink = function(atlassianDetails, issueKey, commentId){

    return atlassianDetails.jiraUrl+"/browse/"+issueKey+"?focusedCommentId="+commentId+"&page=com.atlassian.jira.plugin.system.issuetabpanels:comment-tabpanel#comment-"+commentId;

};

module.exports = {
    checkCredentials: checkCredentials,
    postBuildStatus: postBuildStatus,
    postBuildResults: postBuildResults,
    logBuildResults: logBuildResults,
    getJiraIssueCommentLink: getJiraIssueCommentLink
};