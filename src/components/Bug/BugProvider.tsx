import React, {useCallback, useContext, useEffect, useReducer} from 'react';
import PropTypes from 'prop-types';
import {getLogger} from '../../core';
import {BugProps} from './BugProps';
import {createBugApi, deleteBugApi, getBugsApi, newWebSocket, updateBugApi} from './bugApi';
import {AuthContext} from '../../auth';

import {Plugins} from "@capacitor/core"

const log = getLogger('BugProvider');
const {Storage} = Plugins;

type SaveBugFn = (bug: BugProps, connected: boolean) => Promise<any>;
type DeleteBugFn = (bug: BugProps, connected: boolean) => Promise<any>;
type UpdateServerFn = () => Promise<any>;
type ServerBug = (id: string, version: number) => Promise<any>;

export interface BugState {
    bugs?: BugProps[],
    fetching: boolean,
    fetchingError?: Error | null,
    saving: boolean,
    deleting: boolean,
    savingError?: Error | null,
    deletingError?: Error | null,
    saveBug?: SaveBugFn,
    deleteBug?: DeleteBugFn;
    updateServer?: UpdateServerFn,
    getServerBug?: ServerBug,
}

interface ActionProps {
    type: string,
    payload?: any,
}

const initialState: BugState = {
    fetching: false,
    saving: false,
    deleting: false,
};

const FETCH_BUGS_STARTED = 'FETCH_BUGS_STARTED';
const FETCH_BUGS_SUCCEEDED = 'FETCH_BUGS_SUCCEEDED';
const FETCH_BUGS_FAILED = 'FETCH_BUGS_FAILED';

const SAVE_BUG_STARTED = 'SAVE_BUG_STARTED';
const SAVE_BUG_SUCCEEDED = 'SAVE_BUG_SUCCEEDED';
const SAVE_BUG_SUCCEEDED_OFFLINE = "SAVE_BUG_SUCCEEDED_OFFLINE";
const SAVE_BUG_FAILED = 'SAVE_BUG_FAILED';

const DELETE_BUG_STARTED = "DELETE_BUG_STARTED";
const DELETE_BUG_SUCCEEDED = "DELETE_BUG_SUCCEEDED";
const DELETE_BUG_FAILED = "DELETE_BUG_FAILED";

const reducer: (state: BugState, action: ActionProps) => BugState =
    (state, {type, payload}) => {
        switch (type) {
            case FETCH_BUGS_STARTED:
                return {...state, fetching: true, fetchingError: null};
            case FETCH_BUGS_SUCCEEDED:
                return {...state, bugs: payload.bugs, fetching: false};
            case FETCH_BUGS_FAILED:
                return {...state, fetchingError: payload.error, fetching: false};

            case SAVE_BUG_STARTED:
                return {...state, savingError: null, saving: true};
            case SAVE_BUG_SUCCEEDED:
            case SAVE_BUG_SUCCEEDED_OFFLINE:
                const bugs = [...(state.bugs || [])];
                const bug = payload.bug;
                const index = bugs.findIndex(it => it._id === bug._id);
                if (index === -1) {
                    bugs.splice(0, 0, bug);
                } else {
                    bugs[index] = bug;
                }
                return {...state, bugs: bugs, saving: false};
            case SAVE_BUG_FAILED:
                return {...state, savingError: payload.error, saving: false};

            case DELETE_BUG_STARTED:
                return {...state, deletingError: null, deleting: true};
            case DELETE_BUG_SUCCEEDED: {
                const bugs = [...(state.bugs || [])];
                const bug = payload.bug;
                const index = bugs.findIndex((it) => it._id === bug._id);
                bugs.splice(index, 1);
                return {...state, bugs: bugs, deleting: false};
            }
            case DELETE_BUG_FAILED:
                return {...state, deletingError: payload.error, deleting: false};
            default:
                return state;
        }
    };

export const BugContext = React.createContext<BugState>(initialState);

interface BugProviderProps {
    children: PropTypes.ReactNodeLike,
}

export const BugProvider: React.FC<BugProviderProps> = ({children}) => {
    const {token} = useContext(AuthContext);
    const [state, dispatch] = useReducer(reducer, initialState);
    const {
        bugs,
        fetching,
        fetchingError,
        saving,
        deleting,
        savingError,
        deletingError,
    } = state;
    useEffect(getBugsEffect, [token]);
    useEffect(wsEffect, [token]);
    const saveBug = useCallback<SaveBugFn>(saveBugCallback, [token]);
    const deleteBug = useCallback<DeleteBugFn>(deleteBugCallback, [token]);
    const updateServer = useCallback<UpdateServerFn>(updateServerCallback, [token]);
    const value = {
        bugs,
        fetching,
        fetchingError,
        saving,
        deleting,
        savingError,
        deletingError,
        saveBug,
        deleteBug,
        updateServer,
    };
    log('returns');
    return (
        <BugContext.Provider value={value}>
            {children}
        </BugContext.Provider>
    );

    function getBugsEffect() {
        let canceled = false;
        fetchBugs();
        return () => {
            canceled = true;
        }

        async function fetchBugs() {
            if (!token?.trim()) {
                return;
            }
            try {
                log('fetchBugs started');
                dispatch({type: FETCH_BUGS_STARTED});
                const bugs = await getBugsApi(token);
                log('fetchBugs succeeded');
                if (!canceled) {
                    dispatch({type: FETCH_BUGS_SUCCEEDED, payload: {bugs: bugs}});
                }
            } catch (error) {
                log('fetchBugs failed');
                let realKeys: string[] = [];
                await Storage.keys().then((keys) => {
                    return keys.keys.forEach(function (value) {
                        if (value !== "user" && typeof value != typeof [])
                            realKeys.push(value);
                    })
                });

                let values: string[] = [];
                for (const key1 of realKeys) {
                    await Storage.get({key: key1}).then((value) => {
                        // @ts-ignore
                        values.push(value.value);
                    })
                }
                const bugs: BugProps[] = [];
                for (const value of values) {
                    let bug = JSON.parse(value);
                    bugs.push(bug);
                }
                if (!canceled) {
                    log(bugs);
                    dispatch({type: FETCH_BUGS_SUCCEEDED, payload: {bugs: bugs}});
                }
            }
        }
    }

    async function saveBugCallback(bug: BugProps, connected: boolean) {
        if (!connected) {
            throw new Error();
        }
        try {
            log('saveBug started');
            dispatch({type: SAVE_BUG_STARTED});
            const savedBug = await (bug._id ? updateBugApi(token, bug) : createBugApi(token, bug));
            log('saveBug succeeded');
            dispatch({type: SAVE_BUG_SUCCEEDED, payload: {bug: savedBug}});
        } catch (error) {
            log('saveBug failed with error: ', error);

            if (bug._id === undefined) {
                bug._id = generateRandomID()
                bug.status = 1;
                alert("Bug saved local, data was not sent to the server");
            } else {
                bug.status = 2;
                alert("Bug updated local, data was not sent to the server");
            }
            await Storage.set({
                key: bug._id,
                value: JSON.stringify(bug),
            });

            dispatch({type: SAVE_BUG_SUCCEEDED_OFFLINE, payload: {bug: bug}});
        }
    }

    async function deleteBugCallback(bug: BugProps, connected: boolean) {
        if (!connected) {
            throw new Error();
        }
        try {
            dispatch({type: DELETE_BUG_STARTED});
            const deletedBug = await deleteBugApi(token, bug);
            log(deletedBug);
            await Storage.remove({key: bug._id!});
            dispatch({type: DELETE_BUG_SUCCEEDED, payload: {bug: bug}});
        } catch (error) {
            bug.status = 3;
            await Storage.set({
                key: JSON.stringify(bug._id),
                value: JSON.stringify(bug),
            });
            alert("Product deleted local, data was not sent to the server");
            dispatch({type: DELETE_BUG_SUCCEEDED, payload: {bug: bug}});
        }
    }

    async function updateServerCallback() {
        //grab bugs from local storage
        const allKeys = Storage.keys();
        let promisedBugs;
        var i;

        promisedBugs = await allKeys.then(function (allKeys) {
            const promises = [];
            for (i = 0; i < allKeys.keys.length; i++) {
                const promiseBug = Storage.get({key: allKeys.keys[i]});
                promises.push(promiseBug);
            }
            return promises;
        });

        for (i = 0; i < promisedBugs.length; i++) {
            const promise = promisedBugs[i];
            const bug = await promise.then(function (it) {
                var object;
                try {
                    object = JSON.parse(it.value!);
                } catch (e) {
                    return null;
                }
                return object;
            });
            try {
                if (bug !== null) {
                    //bug has to be added
                    if (bug.status === 1) {
                        dispatch({type: DELETE_BUG_SUCCEEDED, payload: {bug: bug}});
                        await Storage.remove({key: bug._id});
                        const oldBug = bug;
                        delete oldBug._id;
                        oldBug.status = 0;
                        const newBug = await createBugApi(token, oldBug);
                        dispatch({type: SAVE_BUG_SUCCEEDED, payload: {bug: newBug}});
                        await Storage.set({
                            key: JSON.stringify(newBug._id),
                            value: JSON.stringify(newBug),
                        });
                    }
                    //bug has to be updated
                    else if (bug.status === 2) {
                        bug.status = 0;
                        const newBug = await updateBugApi(token, bug);
                        dispatch({type: SAVE_BUG_SUCCEEDED, payload: {bug: newBug}});
                        await Storage.set({
                            key: JSON.stringify(newBug._id),
                            value: JSON.stringify(newBug),
                        });
                    }
                    //bug has to be deleted
                    else if (bug.status === 3) {
                        bug.status = 0;
                        await deleteBugApi(token, bug);
                        await Storage.remove({key: bug._id});
                    }
                }
            } catch (e) {
                log(e);
            }
        }
    }

    function generateRandomID() {
        return "_" + Math.random().toString(36).substr(2, 9);
    }

    function wsEffect() {
        let canceled = false;
        log('wsEffect - connecting');
        let closeWebSocket: () => void;
        if (token?.trim()) {
            closeWebSocket = newWebSocket(token, message => {
                if (canceled) {
                    return;
                }
                const {type, payload: bug} = message;
                log(`ws message, bug ${type}`);
                if (type === 'created' || type === 'updated') {
                    dispatch({type: SAVE_BUG_SUCCEEDED, payload: {bug}});
                }
            });
        }
        return () => {
            log('wsEffect - disconnecting');
            canceled = true;
            closeWebSocket?.();
        }
    }
};
