import React, {useContext, useEffect, useState} from 'react';
import {RouteComponentProps} from 'react-router';
import {Redirect} from "react-router-dom";
import {
    createAnimation,
    IonButton, IonButtons,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon, IonInfiniteScroll, IonInfiniteScrollContent,
    IonLoading,
    IonPage, IonSearchbar, IonSelect, IonSelectOption,
    IonTitle,
    IonToolbar,
    IonLabel
} from '@ionic/react';
import {add} from 'ionicons/icons';
import Bug from './Bug';
import {getLogger} from '../../core';
import {BugContext} from './BugProvider';
import {AuthContext} from "../../auth";
import {BugProps} from "./BugProps";
import {useNetwork} from "../../core/useNetwork";

const log = getLogger('BugList');

const BugList: React.FC<RouteComponentProps> = ({history}) => {
    const {bugs, fetching, fetchingError, updateServer} = useContext(BugContext);
    const [disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(
        false
    );
    const [filter, setFilter] = useState<string | undefined>(undefined);
    const [search, setSearch] = useState<string>('');
    const [pos, setPos] = useState(10);
    const selectOptions = ["all", "<5", ">=5", "0"];
    const [bugsShow, setBugsShow] = useState<BugProps[]>([]);
    const {logout} = useContext(AuthContext);
    const {networkStatus} = useNetwork();

    const handleLogout = () => {
        logout?.();
        return <Redirect to={{pathname: "/login"}}/>;
    };

    //update server when network status is back online
    useEffect(() => {
        if (networkStatus.connected) {
            updateServer && updateServer();
        }
    }, [networkStatus.connected]);

    log("render");

    async function searchNext($event: CustomEvent<void>) {
        if (bugs && pos < bugs.length) {
            setBugsShow([...bugs.slice(0, 10 + pos)]); //
            setPos(pos + 5);
        } else {
            setDisableInfiniteScroll(true);
        }
        log('products from ' + 0 + " to " + pos)
        log(bugsShow)
        await ($event.target as HTMLIonInfiniteScrollElement).complete();
    }

    useEffect(() => {
        if (bugs?.length) {
            log(bugs);
            setBugsShow(bugs.slice(0, pos));
        }
    }, [bugs]);

    useEffect(() => {
        if (search && bugs) {
            setBugsShow(bugs.filter((bug) => bug.title.startsWith(search)));
        }
    }, [search]);

    useEffect(() => {
        if (filter && bugs) {
            log(filter);
            if (filter === "<5") {
                setBugsShow(bugs.filter((bug) => bug.priority < 5));
            } else if (filter === ">=5") {
                setBugsShow(bugs.filter((bug) => bug.priority >= 5));
            } else if (filter === "0") {
                setBugsShow(bugs.filter((bug) => bug.priority === 0));
            } else if (filter === "all") {
                setBugsShow(bugs);
            }
        }
    }, [filter]);

    function simpleAnimation() {
        const el = document.querySelector(".main-title");
        if (el) {
            const animation = createAnimation()
                .addElement(el)
                .duration(1000)
                .direction("alternate")
                .iterations(Infinity)
                .keyframes([
                    {offset: 0, transform: "scale(0.9)"},
                    {offset: 1, transform: "scale(1)"},
                ]);
            animation.play();
        }
    }

    useEffect(simpleAnimation, []);

    function groupAnimations() {
        const elem1 = document.querySelector('.searchBar');
        const elem2 = document.querySelector('.networkStatus');
        if (elem1 && elem2) {
            const animation1 = createAnimation()
                .addElement(elem1)
                .fromTo('transform', 'scale(0.8)', 'scale(1)');
            const animation2 = createAnimation()
                .addElement(elem2)
                .fromTo('transform', 'scale(0.5)', 'scale(1)');
            const parentAnimation = createAnimation()
                .duration(500)
                .direction("alternate")
                .iterations(5)
                .addAnimation([animation1, animation2]);
            parentAnimation.play();
        }
    }

    useEffect(groupAnimations, []);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle className="main-title ion-text-center">Bug tracking app</IonTitle>
                    <div className="networkStatus">Status: {networkStatus.connected ? "online" : "offline"}</div>
                    <IonButtons slot="end">
                        <IonButton onClick={handleLogout}>
                            Logout
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonLoading isOpen={fetching} message="Fetching Bugs"/>
                <div className="searchBar">
                    <IonSearchbar
                        value={search}
                        debounce={1000}
                        onIonChange={(e) => setSearch(e.detail.value!)}
                    />
                </div>
                <div className="select">
                    <IonLabel>Filter by priority</IonLabel>
                    <IonSelect
                        value={filter}
                        placeholder="No active filter"
                        onIonChange={(e) => setFilter(e.detail.value)}
                    >
                        {selectOptions.map((option) => (
                            <IonSelectOption key={option} value={option}>
                                {option}
                            </IonSelectOption>
                        ))}
                    </IonSelect>
                </div>
                {bugsShow &&
                bugsShow
                    .filter((bug: BugProps) => bug.status !== 3)
                    .map((bug: BugProps) => {
                        return (
                            <Bug
                                key={bug._id}
                                _id={bug._id}
                                title={bug.title}
                                description={bug.description}
                                priority={bug.priority}
                                status={bug.status}
                                photoPath={bug.photoPath}
                                latitude={bug.latitude}
                                longitude={bug.longitude}
                                onEdit={(id) => history.push(`/bug/${id}`)}
                            />
                        );
                    })}
                <IonInfiniteScroll
                    threshold="100px"
                    disabled={disableInfiniteScroll}
                    onIonInfinite={(e: CustomEvent<void>) => searchNext(e)}>
                    <IonInfiniteScrollContent loadingText="Loading more contacts..."/>
                </IonInfiniteScroll>
                {fetchingError && (
                    <div>{fetchingError.message || 'Failed to fetch Bugs'}</div>
                )}
                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton onClick={() => history.push('/bug')}>
                        <IonIcon icon={add}/>
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );
};

export default BugList;
