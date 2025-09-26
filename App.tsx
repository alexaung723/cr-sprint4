import Amplify from "aws-amplify";
import React, { FC, useEffect, useState } from "react";
import { useQuery } from "react-query";
import { BrowserRouter, Switch } from "react-router-dom";
import { getParticipant, refreshToken } from "./ApiHelper";
import "./App.scss";
import { handleUserAuth } from "./AuthHelper";
import { AppEnv, amplifyConfig, appEnv } from "./config";
import { ParticipantRank } from "./models/participant.model";
import EventView from "./pages/EventView/EventView";
import SplashPage from "./pages/SplashPage/SplashPage";
import { LOCAL_USER_DATA } from "./utils/consts/amplifyKeys";
import { EventStatus, getEventStatus } from "./utils/eventUtil";

Amplify.configure(amplifyConfig);

const isProd = appEnv === AppEnv.Prod;
const isTest = appEnv === AppEnv.Test;
const isDev = appEnv === AppEnv.Dev;
const isLocal = appEnv === AppEnv.Local;

export const ParticipantContext: React.Context<ParticipantRank> =
  React.createContext(null);

type EventSiteProps = {
  showNavBars: boolean;
  setShowNavBars: any;
};

const EventSite: React.FC<EventSiteProps> = ({
  showNavBars,
  setShowNavBars,
}) => {
  const { data: participantData } = useQuery("participant", getParticipant, {
    refetchOnWindowFocus: false,
  });

  return (
    <ParticipantContext.Provider value={participantData}>
      <BrowserRouter>
        <Switch>
          {/** Modify the eventStatus prop for changing views during local development */}
          {isLocal && (
            <EventView
              showNavBars={showNavBars}
              setShowNavBars={setShowNavBars}
              eventStatus={EventStatus.InProgress}
            />
          )}
          {/** Modify the eventStatus prop for changing views in the dev site */}
          {isDev && (
            <EventView
              showNavBars={showNavBars}
              setShowNavBars={setShowNavBars}
              eventStatus={EventStatus.InProgress}
            />
          )}
          {/** Modify the eventStatus prop for changing views in the test site */}
          {isTest && (
            <EventView
              showNavBars={showNavBars}
              setShowNavBars={setShowNavBars}
              eventStatus={EventStatus.InProgress}
            />
          )}
          {/** Do not modify the event status here */}
          {isProd && (
            <EventView
              showNavBars={showNavBars}
              setShowNavBars={setShowNavBars}
              eventStatus={getEventStatus()}
            />
          )}
        </Switch>
      </BrowserRouter>
    </ParticipantContext.Provider>
  );
};

const App: FC = () => {
  const [showNavBars, setShowNavBars] = useState(true);
  const [userData, setUserData] = useState(
    JSON.parse(String(localStorage.getItem(LOCAL_USER_DATA)))
  );

  useEffect(() => {
    refreshToken().then(() => {
      handleUserAuth(userData, setUserData);
    });
  }, [userData]);

  return (
    <div className="App">
      {userData ? (
        <EventSite setShowNavBars={setShowNavBars} showNavBars={showNavBars} />
      ) : (
        <SplashPage />
      )}
    </div>
  );
};

export default App;
