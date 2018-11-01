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

type AdditionalStoryState = 'chore';

const getStatusResult = (state: pivotalClient.StoryState | AdditionalStoryState): StoryResult => {
    switch (state) {
        case 'accepted':
            return { state: 'success', description: 'Story is ACCEPTED' };
        case 'rejected':
            return { state: 'failure', description: 'Story is REJECTED' };
        case 'started':
            return { state: 'pending', description: 'Story is STARTED' };
        case 'delivered':
            return { state: 'pending', description: 'Story is DELIVERED' };
        case 'finished':
            return { state: 'pending', description: 'Story is FINISHED' };
        case 'chore':
            return { state: 'success', description: 'Story is a CHORE'};
        default:
            return { state: 'pending', description: 'Story awaiting update' };
    }
}

const updateStory = async (storyId: number) => {
    const story = await pivotalClient.get(storyId);
    for (const request of story.pull_requests) {
        const pullRequest = await githubClient.getPullRequest(request.owner, request.repo, request.number)
        let statusResult = null;
        if (pullRequest.state === 'open' && story.story_type !== 'chore') {
            statusResult = getStatusResult(story.current_state);
        } else if (pullRequest.state === 'open' && story.story_type === 'chore') {
            statusResult = getStatusResult('chore');
        } else {
            return;
        }

        await githubClient.putStatusCheck(request.owner, request.repo, pullRequest.head.sha, statusResult.state, story.url, statusResult.description);
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
                console.info(`Processed webhook for story ${storyId}`);
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
