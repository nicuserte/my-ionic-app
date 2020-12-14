import React, { useCallback, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../../core';
import { BugProps } from './BugProps';
import { createBug, getBugs, newWebSocket, updateBug } from './bugApi';

const log = getLogger('BugProvider');

type SaveBugFn = (item: BugProps) => Promise<any>;

export interface ItemsState {
  bugs?: BugProps[],
  fetching: boolean,
  fetchingError?: Error | null,
  saving: boolean,
  savingError?: Error | null,
  saveBug?: SaveBugFn,
}

interface ActionProps {
  type: string,
  payload?: any,
}

const initialState: ItemsState = {
  fetching: false,
  saving: false,
};

const FETCH_ITEMS_STARTED = 'FETCH_ITEMS_STARTED';
const FETCH_ITEMS_SUCCEEDED = 'FETCH_ITEMS_SUCCEEDED';
const FETCH_ITEMS_FAILED = 'FETCH_ITEMS_FAILED';
const SAVE_ITEM_STARTED = 'SAVE_ITEM_STARTED';
const SAVE_ITEM_SUCCEEDED = 'SAVE_ITEM_SUCCEEDED';
const SAVE_ITEM_FAILED = 'SAVE_ITEM_FAILED';

const reducer: (state: ItemsState, action: ActionProps) => ItemsState =
  (state, { type, payload }) => {
    switch (type) {
      case FETCH_ITEMS_STARTED:
        return { ...state, fetching: true, fetchingError: null };
      case FETCH_ITEMS_SUCCEEDED:
        return { ...state, bugs: payload.bugs, fetching: false };
      case FETCH_ITEMS_FAILED:
        return { ...state, fetchingError: payload.error, fetching: false };
      case SAVE_ITEM_STARTED:
        return { ...state, savingError: null, saving: true };
      case SAVE_ITEM_SUCCEEDED:
        const items = [...(state.bugs || [])];
        const item = payload.item;
        const index = items.findIndex(it => it.id === item.id);
        if (index === -1) {
          items.splice(0, 0, item);
        } else {
          items[index] = item;
        }
        return { ...state, bugs: items, saving: false };
      case SAVE_ITEM_FAILED:
        return { ...state, savingError: payload.error, saving: false };
      default:
        return state;
    }
  };

export const BugContext = React.createContext<ItemsState>(initialState);

interface BugProviderProps {
  children: PropTypes.ReactNodeLike,
}

export const BugProvider: React.FC<BugProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { bugs, fetching, fetchingError, saving, savingError } = state;
  useEffect(getItemsEffect, []);
  useEffect(wsEffect, []);
  const saveBug = useCallback<SaveBugFn>(saveItemCallback, []);
  const value = { bugs, fetching, fetchingError, saving, savingError, saveBug };
  log('returns');
  return (
    <BugContext.Provider value={value}>
      {children}
    </BugContext.Provider>
  );

  function getItemsEffect() {
    let canceled = false;
    fetchItems();
    return () => {
      canceled = true;
    }

    async function fetchItems() {
      try {
        log('fetchItems started');
        dispatch({ type: FETCH_ITEMS_STARTED });
        const items = await getBugs();
        log('fetchItems succeeded');
        if (!canceled) {
          dispatch({ type: FETCH_ITEMS_SUCCEEDED, payload: { bugs: items } });
        }
      } catch (error) {
        log('fetchItems failed');
        dispatch({ type: FETCH_ITEMS_FAILED, payload: { error } });
      }
    }
  }

  async function saveItemCallback(item: BugProps) {
    try {
      log('saveItem started');
      dispatch({ type: SAVE_ITEM_STARTED });
      const savedItem = await (item.id ? updateBug(item) : createBug(item));
      log('saveItem succeeded');
      dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item: savedItem } });
    } catch (error) {
      log('saveItem failed');
      dispatch({ type: SAVE_ITEM_FAILED, payload: { error } });
    }
  }

  function wsEffect() {
    let canceled = false;
    log('wsEffect - connecting');
    const closeWebSocket = newWebSocket(message => {
      if (canceled) {
        return;
      }
      const { event, payload: { item } } = message;
      log(`ws message, item ${event}`);
      if (event === 'created' || event === 'updated') {
        dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item } });
      }
    });
    return () => {
      log('wsEffect - disconnecting');
      canceled = true;
      closeWebSocket();
    }
  }
};
