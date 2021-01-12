import React, {useContext, useEffect, useState} from 'react';
import {
    IonActionSheet,
    IonButton,
    IonButtons,
    IonContent, IonFab, IonFabButton,
    IonHeader, IonIcon,
    IonInput, IonItem, IonLabel,
    IonPage,
    IonTitle,
    IonToolbar,
    IonImg, createAnimation
} from '@ionic/react';
import {getLogger} from '../../core';
import {BugContext} from './BugProvider';
import {RouteComponentProps} from 'react-router';
import {BugProps} from './BugProps';
import {useNetwork} from "../../core/useNetwork";
import {camera, close, trash} from "ionicons/icons";
import {Photo, usePhotoGallery} from "../../core/usePhotoGallery";
import {MyMap} from "../MyMap/MyMap";

const log = getLogger('BugEdit');

interface BugEditProps extends RouteComponentProps<{
    id?: string;
}> {
}

const defaultPos={
    latitude: 46.33617904676352,
    longitude: 24.293073702342262
};

const BugEdit: React.FC<BugEditProps> = ({history, match}) => {
    const {bugs, saveBug, deleteBug} = useContext(BugContext);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState(0);
    const [photoPath, setPhotoPath] = useState('');
    const [latitude, setLatitude] = useState(defaultPos.latitude);
    const [longitude, setLongitude] = useState(defaultPos.longitude);
    const [bug, setBug] = useState<BugProps>();
    const {networkStatus} = useNetwork();
    const {photos, takePhoto, deletePhoto} = usePhotoGallery();
    const [photoToDelete, setPhotoToDelete] = useState<Photo>();

    useEffect(() => {
        log('useEffect');
        const routeId = match.params.id || '';
        const bug = bugs?.find(it => it._id === routeId);
        setBug(bug);
        if (bug) {
            setTitle(bug.title);
            setDescription(bug.description);
            setPriority(bug.priority);
            setPhotoPath(bug.photoPath);
            if (bug.latitude) setLatitude(bug.latitude);
            if (bug.longitude) setLongitude(bug.longitude);
        }
    }, [match.params.id, bugs]);

    const handleSave = () => {
        const editedBug = bug
            ? {
                ...bug,
                title,
                description,
                priority,
                status: 0,
                photoPath,
                latitude,
                longitude
            }
            : {
                title,
                description,
                priority,
                status: 0,
                photoPath,
                latitude,
                longitude
            };
        saveBug && saveBug(editedBug, networkStatus.connected).then(() => {
            history.goBack();
        })
    };

    const handleDelete = () => {
        const editBug = bug
            ? {
                ...bug,
                title,
                description,
                priority,
                status: 0,
                photoPath,
                latitude,
                longitude
            }
            : {
                title,
                description,
                priority,
                status: 0,
                photoPath,
                latitude,
                longitude
            };
        deleteBug && deleteBug(editBug, networkStatus.connected).then(() => history.goBack());
    }

    function chainAnimations() {
        const label1 = document.querySelector('.label1');
        const label2 = document.querySelector('.label2');
        const label3 = document.querySelector('.label3');
        const elem2 = document.querySelector('.group');
        if (label1 && label2 && label3) {
            const animation1 = createAnimation()
                .addElement(Array.of(label1, label2))
                .duration(300)
                .direction("alternate")
                .iterations(3)
                .fromTo('transform', 'rotate(0)', 'rotate(90deg)')
                .fromTo('transform', 'rotate(90deg)', 'rotate(0)');

            const animation2 = createAnimation()
                .addElement(label3)
                .duration(300)
                .fromTo('transform', 'scale(0.3)', 'scale(1)');

            (async () => {
                await animation1.play();
                await animation2.play();
            })();
        }
    }

    useEffect(chainAnimations, []);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Edit</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleSave}>
                            Save
                        </IonButton>
                        <IonButton onClick={handleDelete}>
                            Delete
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonItem>
                    <div className="label1"><IonLabel>Title:</IonLabel></div>
                    <IonInput
                        className="inputField"
                        placeholder="Title"
                        value={title}
                        onIonChange={e => setTitle(e.detail.value || '')}/>
                </IonItem>
                <IonItem>
                    <div className="label2"><IonLabel>Description:</IonLabel></div>
                    <IonInput
                        className="inputField"
                        placeholder="Description"
                        value={description}
                        onIonChange={e => setDescription(e.detail.value || '')}/>
                </IonItem>
                <IonItem>
                    <div className="label3"><IonLabel>Priority:</IonLabel>
                    </div>
                    <IonInput
                        className="inputField"
                        placeholder="Priority"
                        value={priority}
                        onIonChange={e => setPriority(Number.parseInt(e.detail.value || '0'))}/>
                </IonItem>

                <IonImg
                    style={{width: "500px", height: "500px", margin: "0 auto"}}
                    onClick={() => {
                        setPhotoToDelete(photos?.find(item => item.webviewPath === photoPath))
                    }}
                    alt={"No photo"}
                    src={photoPath}
                />
                <MyMap
                    lat={latitude}
                    lng={longitude}
                    onMapClick={(location: any) => {
                        setLatitude(location.latLng.lat());
                        setLongitude(location.latLng.lng());
                    }}
                />
                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton
                        onClick={() => {
                            const photoTaken = takePhoto();
                            photoTaken.then((data) => {
                                setPhotoPath(data.webviewPath!);
                            });
                        }}
                    >
                        <IonIcon icon={camera}/>
                    </IonFabButton>
                </IonFab>
                <IonActionSheet
                    isOpen={!!photoToDelete}
                    buttons={[
                        {
                            text: "Delete",
                            role: "destructive",
                            icon: trash,
                            handler: () => {
                                if (photoToDelete) {
                                    deletePhoto(photoToDelete);
                                    setPhotoToDelete(undefined);
                                    setPhotoPath("")
                                }
                            },
                        },
                        {
                            text: "Cancel",
                            icon: close,
                            role: "cancel",
                        },
                    ]}
                    onDidDismiss={() => setPhotoToDelete(undefined)}
                />
            </IonContent>
        </IonPage>
    );
};

export default BugEdit;
