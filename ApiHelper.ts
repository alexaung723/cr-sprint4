import { CognitoUserSession } from "amazon-cognito-identity-js";
import { Auth } from "aws-amplify";
import { EventType, apiBaseUrl } from "./config";
import {
  Challenge,
  ChallengeType,
  SubmissionRequest,
} from "./models/challenge.model";
import {
  Event,
  EventClaim,
  SaveEventLike,
  SaveEventLikeRequest,
} from "./models/event.model";
import { Market } from "./models/market.model";
import { ParticipantRank } from "./models/participant.model";
import { Quiz, QuizRequest, QuizUserAnswer } from "./models/quiz.model";

const AUTH_PROVIDER = "SlalomOIDC";
const LOCAL_USER_DATA = "user-data";
const EVENT_TYPE: EventType = "hacktober";

interface UserData {
  jwtToken: string;
  userId: string;
  email: string;
  exp: number;
}

export const getRequest = async <T>(
  url: string,
  withEmail = false
): Promise<T | null> => {
  const userData = await refreshToken();
  url = withEmail ? `${url}/${userData.email}` : url;

  const input = {
    method: "GET",
    headers: {
      Authorization: "Bearer " + userData?.jwtToken,
      "Event-Type": EVENT_TYPE,
    },
  };

  return await fetch(`${apiBaseUrl}${url}`, input).then((res) =>
    res.status !== 500 ? res.json() : null
  );
};

export const postRequest = async <T>(url: string, body): Promise<T | null> => {
  const userData = await refreshToken();
  const input = {
    method: "POST",
    headers: {
      Authorization: "Bearer " + userData?.jwtToken,
      "Event-Type": EVENT_TYPE,
    },
    body: JSON.stringify(body),
  };

  return await fetch(`${apiBaseUrl}${url}`, input).then((res) =>
    res.status !== 500 ? res.json() : null
  );
};

export const refreshToken = async (): Promise<UserData> => {
  let authResponse: CognitoUserSession;
  try {
    // Make sure we have a current access token
    authResponse = await Auth.currentSession();
  } catch (e) {
    await Auth.federatedSignIn({ customProvider: AUTH_PROVIDER });
    authResponse = await Auth.currentSession();
  }

  const userData: UserData = {
    jwtToken: authResponse?.getIdToken().getJwtToken(),
    userId: authResponse?.getIdToken().payload.identities[0]?.userId,
    email: authResponse?.getIdToken().payload.email,
    exp: authResponse?.getIdToken().payload.exp,
  };

  // Push the refreshed token into the "user-data" localstorage, which is referenced by some components
  localStorage.setItem(LOCAL_USER_DATA, JSON.stringify(userData));
  return userData;
};

export const getParticipant = async (): Promise<ParticipantRank | null> => {
  return await getRequest<ParticipantRank>("/participant", true);
};

export const getMarkets = async (): Promise<Market[] | null> => {
  return await getRequest<Market[]>("/participants/markets");
};

export const getParticipants = async (
  _key,
  market?: string
): Promise<ParticipantRank[] | null> => {
  if (market) {
    return await getRequest<ParticipantRank[]>(`/participants/${market}`);
  } else {
    return null;
  }
};

export const getEvents = async (): Promise<Event[] | null> => {
  return await getRequest<Event[]>("/events");
};

export const getEvent = async (
  _key,
  eventId: number
): Promise<Event | null> => {
  return await getRequest<Event>(`/events/${eventId}`);
};

export const postEventToUserCalendar = async (
  eventId: number
): Promise<string | null> => {
  return await postRequest<string>(`/events`, { eventId: eventId });
};

export const postEventClaim = async (
  eventCode: string
): Promise<EventClaim | null> => {
  const userData = await refreshToken();
  let claimRequest = {
    eventCode,
    user: userData.email,
  };
  return await postRequest<EventClaim>("/events/claim", claimRequest);
};

// TODO: Remove
export const getQuiz = async (_key): Promise<Quiz | null> => {
  return await getRequest("/quiz", true);
};

// TODO: Remove
export const postQuizAnswer = async (
  mutatedData: QuizRequest
): Promise<QuizUserAnswer | null> => {
  const userData = await refreshToken();
  let quizResponse = {
    ...mutatedData,
    user: userData.email,
  };
  return await postRequest("/quiz/answer", quizResponse);
};

export const postLikeEvent = async ({
  eventId,
  activityLikeId,
  liked,
}: SaveEventLikeRequest): Promise<SaveEventLike | null> => {
  const userData = await refreshToken();
  const likeEventData = {
    userId: userData.email,
    activityLikeId,
    liked,
  };
  return await postRequest<SaveEventLike>(
    `/event/${eventId}/like`,
    likeEventData
  );
};

export const getChallenges = async (
  type: ChallengeType
): Promise<Challenge[] | null> => {
  const userData = await refreshToken();
  return await getRequest<Challenge[]>(
    `/challenges?type=${type}&user=${userData.email}`
  );
};

export const postSubmission = async (
  submission: SubmissionRequest
): Promise<Challenge | null> => {
  const userData = await refreshToken();
  submission.user = userData.email;
  return await postRequest<Challenge>("/submissions", submission);
};
