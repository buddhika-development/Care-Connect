import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const getJitsiConfig = () => {
  const APP_ID = process.env.JITSI_APP_ID;
  const KID = process.env.JITSI_KID;
  const BASE_URL = (process.env.JITSI_BASE_URL || "https://8x8.vc").replace(/\/$/, "");
  let PRIVATE_KEY = process.env.JITSI_PRIVATE_KEY;

  if (!APP_ID || !KID || !PRIVATE_KEY) {
    throw new Error("Missing required Jitsi configuration (JITSI_APP_ID, JITSI_KID, JITSI_PRIVATE_KEY).");
  }

  // Remove variable name prefix if present
  if (PRIVATE_KEY.includes("JITSI_PRIVATE_KEY=")) {
    PRIVATE_KEY = PRIVATE_KEY.replace("JITSI_PRIVATE_KEY=", "");
  }

  // Remove surrounding quotes if present
  PRIVATE_KEY = PRIVATE_KEY.replace(/^"|"$/g, "");

  // Replace literal \n with actual newlines
  PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, "\n");

  return { APP_ID, KID, BASE_URL, PRIVATE_KEY };
};

export const buildJitsiJoinUrl = (roomName, token) => {
  const { BASE_URL } = getJitsiConfig();
  return token
    ? `${BASE_URL}/${roomName}?jwt=${token}`
    : `${BASE_URL}/${roomName}`;
};

const generateJitsiSession = (appointmentId) => {
  const { APP_ID } = getJitsiConfig();
  void appointmentId;

  const roomName = `${APP_ID}/${uuidv4()}`;

  return {
    roomName,
    patientJoinUrl: buildJitsiJoinUrl(roomName),
    doctorJoinUrl: buildJitsiJoinUrl(roomName),
  };
};

export const generateJitsiToken = (roomName, role) => {
  const { APP_ID, KID, PRIVATE_KEY } = getJitsiConfig();

  const isDoctor = role === "doctor";
  void roomName;

  const payload = {
    iss: "chat",
    aud: "jitsi",
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2,
    nbf: Math.floor(Date.now() / 1000) - 10,
    // JaaS tokens are commonly scoped with wildcard room while APP_ID + room path
    // is enforced in the URL itself. Using specific room path can be rejected.
    room: "*",
    sub: APP_ID,
    context: {
      features: {
        livestreaming: false,
        recording: false,
        transcription: false,
        "outbound-call": false,
      },
      user: {
        id: `${role}-${uuidv4()}`,
        name: isDoctor ? "Doctor" : "Patient",
        moderator: isDoctor,
        affiliation: isDoctor ? "owner" : "member",
      },
    },
  };

  const options = {
    algorithm: "RS256",
    header: { kid: KID },
  };

  return jwt.sign(payload, PRIVATE_KEY, options);
};

export default generateJitsiSession;
