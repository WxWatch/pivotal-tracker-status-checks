import Octokit from '@octokit/rest';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';

const appClient = new Octokit();
const appId = process.env.PTSU_APP_ID;
const pkString = process.env.PTSU_PRIVATE_KEY;
const installationLogin = process.env.PTSU_INSTALL_LOGIN;

if (!appId) {
    console.error('PTSU_APP_ID not set');
}
if (!pkString) {
    console.error('PTSU_PRIVATE_KEY not set');
    process.exit(1);
}
if (!installationLogin) {
    console.error('PTSU_INSTALL_LOGIN not set');
    process.exit(1);
}

const appCert = String(pkString).replace(/\\n/g, '\n');

const generateJwt = (id: string, cert: any) => {
    const payload = {
        iat: Math.floor(new Date().getTime() / 1000),
        exp: Math.floor(new Date().getTime() / 1000) + 60,
        iss: id
    }

    // Sign RS256
    return jwt.sign(payload, cert, { algorithm: 'RS256' });
}

const appAuth = () => {
    // Authenticate as GitHub App
    appClient.authenticate({
        type: 'app',
        token: generateJwt(String(appId), appCert)
    });
}

export const generateInstallationClient = async () => {
    appAuth();
    const res = await appClient.apps.getInstallations({});
    const installations: any[] = res.data;

    const installation = _.find(installations, ['account.login', installationLogin]);

    const installationClient = new Octokit();
    const response = await appClient.apps.createInstallationToken({
        installation_id: installation.id
    });
    const token = response.data.token;

    installationClient.authenticate({
        type: 'app',
        token
    });

    return installationClient;
}

export type StatusState = 'error' | 'failure' | 'pending' | 'success';

export const getPullRequest = async (owner: string, repo: string, pullRequestId: number): Promise<any> => {
    const client = await generateInstallationClient();
    const res = await client.pullRequests.get({ owner, repo, number: pullRequestId });
    return res.data;
};

export const putStatusCheck = async (owner: string, repo: string, sha: string, state: StatusState, targetUrl?: string, description?: string, context: string = 'supplypike/pivotal-tracker'): Promise<any> => {
    const client = await generateInstallationClient();
    const res = await client.repos.createStatus({ owner, repo, sha, state, target_url: targetUrl, description, context });
    return res.data;
}
