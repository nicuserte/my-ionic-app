import React, {useState} from 'react';
import { IonItem, IonLabel, createAnimation, IonModal, IonButton } from '@ionic/react';
import { BugProps } from './BugProps';
import {
    IonImg,
} from '@ionic/react';

interface BugPropsExt extends BugProps {
    onEdit: (id?: string) => void;
}

const Bug: React.FC<BugPropsExt> = ({ _id, title, description, priority, photoPath, onEdit }) => {
    const [showModal, setShowModal] = useState(false);

    const enterAnimation = (baseEl: any) => {
        const backdropAnimation = createAnimation()
            .addElement(baseEl.querySelector("ion-backdrop")!)
            .fromTo("opacity", "0.01", "var(--backdrop-opacity)");

        const wrapperAnimation = createAnimation()
            .addElement(baseEl.querySelector(".modal-wrapper")!)
            .keyframes([
                { offset: 0, opacity: "0", transform: "scale(0)" },
                { offset: 1, opacity: "0.99", transform: "scale(1)" },
            ]);

        return createAnimation()
            .addElement(baseEl)
            .easing("ease-out")
            .duration(500)
            .addAnimation([backdropAnimation, wrapperAnimation]);
    };

    const leaveAnimation = (baseEl: any) => {
        return enterAnimation(baseEl).direction("reverse");
    };

    return (
        <IonItem>
            <IonLabel onClick={() => onEdit(_id)}>{title}</IonLabel>
            <IonLabel onClick={() => onEdit(_id)}>{description}</IonLabel>
            <IonLabel onClick={() => onEdit(_id)}>{priority}</IonLabel>
            <IonLabel>
                <IonImg
                    style={{width: "100px"}}
                    alt={"No Photo"}
                    src={photoPath}
                    onClick={() => {setShowModal(true);}}
                />
            </IonLabel>
            <IonModal
                isOpen={showModal}
                enterAnimation={enterAnimation}
                leaveAnimation={leaveAnimation}
            >
                <IonImg
                    alt={"No Photo"}
                    src={photoPath}
                    onClick={() => {setShowModal(true);}}
                />
                <IonButton onClick={() => setShowModal(false)}>Close Image</IonButton>
            </IonModal>
        </IonItem>
    );
};

export default Bug;
