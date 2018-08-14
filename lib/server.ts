import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import * as pivotalClient from './pivotal-client';
import * as githubClient from './github-client';

const app = new Koa();
const router = new Router();

interface StoryResult {
    state: githubClient.StatusState;
    description: string
}

const getStatusResult = (state: pivotalClient.StoryState): StoryResult => {
    switch (state) {
        case 'accepted':
            return { state: 'success', description: 'Accepted' };
        case 'rejected':
            return { state: 'failure', description: 'Rejected' };
        default:
            return { state: 'pending', description: 'Awaiting Accept/Reject' };
    }
}

const updateStory = async (storyId: number) => {
    const story = await pivotalClient.get(storyId);
    for (const request of story.pull_requests) {
        const pullRequest = await githubClient.getPullRequest(request.owner, request.repo, request.number)
        if (pullRequest.state === 'open') {
            const statusResult = getStatusResult(story.current_state);
            await githubClient.putStatusCheck(request.owner, request.repo, pullRequest.head.sha, statusResult.state, story.url, statusResult.description);
        }
    }
}

export const start = () => {
    router.post('/github-webhook', (ctx, next) => {
        console.log('github webhook received');
        const body: any = ctx.request.body;

        ctx.response.status = 200;
        next();
    });

    router.post('/pivotal-webhook', (ctx, next) => {
        console.log('pivotal webhook received');
        const body: any = ctx.request.body;

        if (!body) {
            return;
        }

        const primaryResources: any[] = body.primary_resources;
        for (const resource of primaryResources) {
            if (resource.kind === 'story') {
                const storyId = resource.id;
                updateStory(storyId);
                console.info(`Processed webhook for story \(storyId)`);
            }
        }

        ctx.response.status = 200;
        next();
    });

    app.use(bodyParser());
    app.use(router.routes());
    app.use(router.allowedMethods());
    app.listen(3069);
    console.info(`Started listening on port 3069`);
};
