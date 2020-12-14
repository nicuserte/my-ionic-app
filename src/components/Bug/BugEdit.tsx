import React, { useContext, useEffect, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonLabel,
  IonLoading,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import { getLogger } from '../../core';
import { RouteComponentProps } from 'react-router';
import { BugProps } from './BugProps';
import { BugContext } from './BugProvider';

const log = getLogger('BugEdit');

interface BugEditProps extends RouteComponentProps<{
  id?: string;
}> {}

const BugEdit: React.FC<BugEditProps> = ({ history, match }) => {
  const { bugs, saving, savingError, saveBug } = useContext(BugContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(0);
  const [bug, setBug] = useState<BugProps>();
  useEffect(() => {
    log('useEffect');
    const routeId = match.params.id || '';
    const bug = bugs?.find(it => it.id === routeId);
    setBug(bug);
    if (bug) {
        setTitle(bug.title);
        setDescription(bug.description);
        setPriority(bug.priority);
    }
  }, [match.params.id, bugs]);
  const handleSave = () => {
    const editedItem = bug ? { ...bug, title, description, priority } : { title, description, priority };
    saveBug && saveBug(editedItem).then(() => history.goBack());
  };
  log('render');
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Edit</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave}>
              Save
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonLabel>Title:</IonLabel>
        <IonInput value={title} onIonChange={e => setTitle(e.detail.value || '')} />
        <IonLabel>Description:</IonLabel>
        <IonInput value={description} onIonChange={e => setDescription(e.detail.value || '')} />
        <IonLabel>Priority:</IonLabel>
        <IonInput value={priority} onIonChange={e => setPriority(parseInt(e.detail.value || '0'))} />
        <IonLoading isOpen={saving} />
        {savingError && (
          <div>{savingError.message || 'Failed to save item'}</div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default BugEdit;
