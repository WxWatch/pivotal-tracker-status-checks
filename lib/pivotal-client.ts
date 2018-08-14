import axios from 'axios';

const projectId = process.env.PTSU_PIVOTAL_PROJECT_ID;
const token = process.env.PTSU_PIVOTAL_TOKEN;

if (!projectId) {
    console.error('PTSU_PIVOTAL_PROJECT_ID not set');
    process.exit(1);
}

if (!token) {
    console.error('PTSU_PIVOTAL_TOKEN not set');
    process.exit(1);
}

const baseURL = 'https://www.pivotaltracker.com/services/v5';
const requester = axios.create({
    baseURL,
    headers: {'X-TrackerToken': token}
})

export type StoryState = 'accepted' | 'delivered' | 'finished' | 'started' | 'rejected' | 'planned' | 'unstarted' | 'unscheduled';

export const get = async (storyId: number) => {
    const response = await requester.get(`/projects/${projectId}/stories/${storyId}?fields=pull_requests,current_state,url`);
    return response.data;
}