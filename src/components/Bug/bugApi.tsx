import axios from 'axios';
import { getLogger } from '../../core';
import { BugProps } from './BugProps';
import { Plugins } from "@capacitor/core";

const { Storage } = Plugins; //local

const log = getLogger('bugApi');

const baseUrl = 'localhost:3000';
const itemUrl = `http://${baseUrl}/bug`;

interface ResponseProps<T> {
  data: T;
}

function withLogs<T>(promise: Promise<ResponseProps<T>>, fnName: string): Promise<T> {
  log(`${fnName} - started`);
  return promise
    .then(res => {
      log(`${fnName} - succeeded`);
      return Promise.resolve(res.data);
    })
    .catch(err => {
      log(`${fnName} - failed`);
      return Promise.reject(err);
    });
}

const config = {
  headers: {
    'Content-Type': 'application/json'
  }
};

export const getBugs: () => Promise<BugProps[]> = () => {
  var result = axios.get(itemUrl, config);
  result.then(function (result) {
    result.data.forEach(async (bug: BugProps) => {
      await Storage.set({
        key: bug.id!,
        value: JSON.stringify({
          id: bug.id,
          title: bug.title,
          description: bug.description,
          priority: bug.priority,
        }),
      });
    });
  });
  return withLogs(result, "getBugs");
}

export const createBug: (item: BugProps) => Promise<BugProps[]> = item => {
  return withLogs(axios.post(itemUrl, item, config), 'createBug');
}

export const updateBug: (item: BugProps) => Promise<BugProps[]> = item => {
  var result = axios.put(`${itemUrl}/${item.id}`, item, config);
  result.then(async function (result) {
    var bug = result.data;
    await Storage.set({
      key: bug.id!,
      value: JSON.stringify({
        id: bug.id,
        title: bug.title,
        description: bug.description,
        priority: bug.priority,
      })
    });
  });
  return withLogs(result, "updateBugs");
}

interface MessageData {
  event: string;
  payload: {
    item: BugProps;
  };
}

export const newWebSocket = (onMessage: (data: MessageData) => void) => {
  const ws = new WebSocket(`ws://${baseUrl}`)
  ws.onopen = () => {
    log('web socket onopen');
  };
  ws.onclose = () => {
    log('web socket onclose');
  };
  ws.onerror = error => {
    log('web socket onerror', error);
  };
  ws.onmessage = messageEvent => {
    log('web socket onmessage');
    onMessage(JSON.parse(messageEvent.data));
  };
  return () => {
    ws.close();
  }
}
