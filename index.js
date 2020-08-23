const core = require('@actions/core');
const github = require('@actions/github');
const fetch = require("node-fetch");

try {
    // `who-to-greet` input defined in action metadata file
    const adminAppId = core.getInput("adminApplicationId");
    const adminAppSecret = core.getInput("adminApplicationSecret");
    const tenantId = core.getInput("tenantId");
    const name = core.getInput('applicationName');
    const isSecretRequired = core.getInput('requireSecret');
    const debugMode = core.getInput('requireSecret');

    getToken(adminAppId, adminAppSecret, tenantId).then(token => {
        createApplication(token, name).then(appId => {
            core.setOutput("clientId", appId);
            if (isSecretRequired) {
                createSecret.then(secret => { core.setOutput("clientSecret", secret); })
            }
            else core.setOutput("clientSecret", "");
            if(debugMode) {
                console.info("Client ID: " + appId);
                console.info("Client Secret: " + secret);
            }
        })
    })
} catch (error) {
    core.setFailed(error.message);
}

function getToken(appId, appSecret, tenantId) {
    return new Promise(resolve => {
        const queryParams = new URLSearchParams();
        queryParams.append('client_id', appId);
        queryParams.append('client_secret', appSecret);
        queryParams.append('scope', "Application.ReadWrite.All");
        queryParams.append('grant_type', "client_credentials");
        const token = fetch("https://login.microsoftonline.com/" + tenantId + "/oauth2/v2.0/token", {
            method: "POST",
            body: queryParams
        }).then(res => {
            res.json().then(json => {
                resolve(json.access_token);
            })
        })
    })
}
function createApplication(token, name) {
    return new Promise(resolve => {
        fetch("https://graph.microsoft.com/v1.0/applications", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token
            },
            body: {
                "displayName": name
            }
        }).then(resp => {
            resp.json.then(app => {
                resolve(app.appId)
            })
        })
    })
}
function createSecret(token, appId) {
    return new Promise(resolve => {
        fetch("https://graph.microsoft.com/v1.0/applications/" + appId + "/addPassword", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token
            },
            body: {
                "displayName": "default"
            }
        }).then(resp => {
            resp.json.then(secret => {
                resolve(secret.secretText);
            })
        })
    })
}