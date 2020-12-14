import React from 'react';
import { IonItem, IonLabel } from '@ionic/react';
import { BugProps } from './BugProps';

interface BugPropsExt extends BugProps{
    onEdit: (id?: string) => void;
}

const Bug: React.FC<BugPropsExt> = ({id, title, description, priority, onEdit}) => {
    return (
        <IonItem onClick={() => onEdit(id)}>
            <IonLabel>{title}</IonLabel>
            <IonLabel>{description}</IonLabel>
            <IonLabel>{priority}</IonLabel>
        </IonItem>
    );
}

export default Bug;