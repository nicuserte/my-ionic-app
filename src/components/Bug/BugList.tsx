import React, { useContext, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonList, IonLoading,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import { add } from 'ionicons/icons';
import Bug from './Bug';
import { getLogger } from '../../core';
import {BugContext} from './BugProvider';

const log = getLogger('BugList');
// const [disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(false);

const BugList: React.FC<RouteComponentProps> = ({ history }) => {
  const { bugs, fetching, fetchingError } = useContext(BugContext);
  log('render');
  async function searchNext($event: CustomEvent<void>) {
    // if (bugs && pos < bugs.length) {
    //   setItems([...items, ...tasks.slice(pos, 10 + pos)]);
    //   setPos(pos + 10);
    // } else {
    //   setDisableInfiniteScroll(true);
    // }
    // ($event.target as HTMLIonInfiniteScrollElement).complete();
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>My App</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonLoading isOpen={fetching} message="Fetching items" />
        {bugs && (
          <IonList>
            {bugs.map(({ id, title, description, priority}) =>
              <Bug key={id} id={id} title={title} description={description} priority={priority}
               onEdit={id => history.push(`/bug/${id}`)} />)}
          </IonList>
        )}
        <IonInfiniteScroll threshold="100px"
          onIonInfinite={(e: CustomEvent<void>) => searchNext(e)}>
          {console.log("Inceput loading....")}
          <IonInfiniteScrollContent
            loadingText="Loading more tasks...">
          </IonInfiniteScrollContent>
          {console.log("Final loading....")}
        </IonInfiniteScroll>
        {fetchingError && (
          <div>{fetchingError.message || 'Failed to fetch items'}</div>
        )}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/bug')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default BugList;
