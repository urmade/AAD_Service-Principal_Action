"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const nodeFetch = __importStar(require("node-fetch"));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Workflow started...");
            // `who-to-greet` input defined in action metadata file
            const adminAppId = core.getInput("adminApplicationId");
            const adminAppSecret = core.getInput("adminApplicationSecret");
            const tenantId = core.getInput("tenantId");
            const name = core.getInput('applicationName');
            const redirectUrls = core.getInput('redirectUrl');
            const logoutUrl = core.getInput('logoutUrl');
            const enableImplicitIdToken = core.getInput("allowImplicitIdToken");
            const enableImplicitAccessToken = core.getInput("allowImplicitAccessToken");
            const isSecretRequired = core.getInput('requireSecret');
            const debugMode = core.getInput('requireSecret');
            console.log(typeof isSecretRequired);
            console.log(typeof enableImplicitIdToken);
            const token = yield getToken(adminAppId, adminAppSecret, tenantId);
            console.info("Token generated...");
            const app = yield createApplication(token, name, redirectUrls, logoutUrl, enableImplicitIdToken, enableImplicitAccessToken);
            console.info("App created...");
            core.setOutput("clientId", app.clientId);
            if (isSecretRequired === "true") {
                const secret = yield createSecret(token, app.id);
                core.setOutput("clientSecret", secret);
                console.info("Secret created...");
                if (debugMode === "true") {
                    console.info("Client ID: " + app.clientId);
                    console.info("Client Secret: " + secret);
                }
            }
            else {
                core.setOutput("clientSecret", "");
                if (debugMode === "true") {
                    console.info("Client ID: " + app.clientId);
                    console.info("Client Secret: ");
                }
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
function getToken(appId, appSecret, tenantId) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const queryParams = new URLSearchParams();
            queryParams.append('client_id', appId);
            queryParams.append('client_secret', appSecret);
            queryParams.append('scope', "https://graph.microsoft.com/.default");
            queryParams.append('grant_type', "client_credentials");
            const token = yield nodeFetch("https://login.microsoftonline.com/" + tenantId + "/oauth2/v2.0/token", {
                method: "POST",
                body: queryParams
            });
            const json = yield token.json();
            resolve(json.access_token);
        }));
    });
}
function createApplication(token, name, redirectUrls, logoutUrl, allowImplicitId, allowImplicitAccess) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            let body = { "displayname": name };
            if (redirectUrls && redirectUrls != "") {
                const urls = redirectUrls.split(",");
                body.web = { redirectUris: urls };
                body.web.implicitGrantSettings = {
                    enableIdTokenIssuance: false,
                    enableAccessTokenIssuance: false
                };
                if (allowImplicitId === "true")
                    body.web.implicitGrantSettings.enableIdTokenIssuance = true;
                if (allowImplicitAccess === "true")
                    body.web.implicitGrantSettings.enableAccessTokenIssuance = true;
            }
            if (logoutUrl !== "") {
                if (body.web)
                    body.web.logoutUrl = logoutUrl;
                else
                    body.web = { logoutUrl: logoutUrl };
            }
            const resp = yield nodeFetch("https://graph.microsoft.com/v1.0/applications", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });
            const json = yield resp.json();
            resolve({
                clientId: json.appId,
                id: json.id
            });
        }));
    });
}
function createSecret(token, appId) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const resp = yield nodeFetch("https://graph.microsoft.com/v1.0/applications/" + appId + "/addPassword", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "displayName": "default"
                })
            });
            const json = yield resp.json();
            resolve(json.secretText);
        }));
    });
}
main();
