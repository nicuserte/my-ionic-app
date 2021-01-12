import axios from 'axios';
import {authConfig, baseUrl, getLogger, withLogs} from '../../core';
import {BugProps} from './BugProps';
import {Plugins} from "@capacitor/core";

const {Storage} = Plugins;
const bugUrl = `http://${baseUrl}/api/bug`;

export const getBugsApi: (token: string) => Promise<BugProps[]> = token => {
    const result = axios.get(bugUrl, authConfig(token));
    result.then(function (result) {
        result.data.forEach(async (bug: BugProps) => {
            await Storage.set({
                key: bug._id!,
                value: JSON.stringify({
                    ...bug
                }),
            });
        });
    }).catch(e => log(e));
    return withLogs(result, "getBugs");
}
export const createBugApi: (token: string, bug: BugProps) => Promise<BugProps> = (token, bug) => {
    const result = axios.post(bugUrl, bug, authConfig(token));
    result.then(async function (r) {
        var bug = r.data;
        await Storage.set({
            key: bug._id!,
            value: JSON.stringify({
                ...bug
            }),
        });
    }).catch(e=>log(e));
    return withLogs(result, "createBug");
}

export const updateBugApi: (token: string, bug: BugProps) => Promise<BugProps> = (token, bug) => {
    const result = axios.put(`${bugUrl}/${bug._id}`, bug, authConfig(token));
    result.then(async function (r) {
        var bug = r.data;
        await Storage.set({
            key: bug._id!,
            value: JSON.stringify({
                ...bug
            }),
        });
    }).catch(e=>log(e));
    return withLogs(result, "updateBug");
}

export const deleteBugApi: (token: string, bug: BugProps) => Promise<BugProps[]> = (token, bug) => {
    const result = axios.delete(`${bugUrl}/${bug._id}`, authConfig(token));
    result.then(async function (r) {
        await Storage.remove({key: bug._id!});
    }).catch(e=>log(e));
    return withLogs(result, "deleteBug");
};

interface MessageData {
    type: string;
    payload: BugProps;
}

const log = getLogger('ws');

export const newWebSocket = (
    token: string,
    onMessage: (data: MessageData) => void
) => {
    const ws = new WebSocket(`ws://${baseUrl}`);
    ws.onopen = () => {
        log("web socket onopen");
        ws.send(JSON.stringify({type: "authorization", payload: {token}}));
    };
    ws.onclose = () => {
        log("web socket onclose");
    };
    ws.onerror = (error) => {
        log("web socket onerror", error);
    };
    ws.onmessage = (messageEvent) => {
        log("web socket onmessage");
        onMessage(JSON.parse(messageEvent.data));
    };
    return () => {
        ws.close();
    }
}
