import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import BugList from './components/Bug/BugList';
import { BugProvider } from './components/Bug/BugProvider';
import BugEdit from './components/Bug/BugEdit';
import { Login } from './components/Login/Login';
import { AuthProvider } from './components/Login/AuthProvider';

const App: React.FC = () => (
  <IonApp>
    <BugProvider>
      <IonReactRouter>
        <IonRouterOutlet>
          <AuthProvider>
            <Route path="/login" component={Login} exact={true} />
            <Route path="/bugs" component={BugList} exact={true} />
            <Route path="/bug" component={BugEdit} exact={true} />
            <Route path="/bug/:id" component={BugEdit} exact={true} />
            <Route exact path="/" render={() => <Redirect to="/bugs" />} />
          </AuthProvider>
        </IonRouterOutlet>
      </IonReactRouter>
    </BugProvider>
  </IonApp>
);

export default App;
