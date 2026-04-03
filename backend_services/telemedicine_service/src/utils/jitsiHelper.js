import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const generateJitsiSession = (appointmentId) => {
  const APP_ID = process.env.JITSI_APP_ID;
  const KID = process.env.JITSI_KID;
  const BASE_URL = process.env.JITSI_BASE_URL || "https://8x8.vc";

  let PRIVATE_KEY = process.env.JITSI_PRIVATE_KEY;

  // Remove variable name prefix if present
  if (PRIVATE_KEY.includes("JITSI_PRIVATE_KEY=")) {
    PRIVATE_KEY = PRIVATE_KEY.replace("JITSI_PRIVATE_KEY=", "");
  }

  // Remove surrounding quotes if present
  PRIVATE_KEY = PRIVATE_KEY.replace(/^"|"$/g, "");

  // Replace literal \n with actual newlines
  PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, "\n");

  const roomName = `${APP_ID}/${uuidv4()}`;

  const basePayload = {
    iss: "chat",
    aud: "jitsi",
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2,
    nbf: Math.floor(Date.now() / 1000) - 10,
    room: "*",
    sub: APP_ID,
    context: {
      features: {
        livestreaming: false,
        recording: false,
        transcription: false,
        "outbound-call": false,
      },
    },
  };

  const patientPayload = {
    ...basePayload,
    context: {
      ...basePayload.context,
      user: {
        id: `patient-${uuidv4()}`,
        name: "Patient",
        moderator: false,
        affiliation: "member",
      },
    },
  };

  const doctorPayload = {
    ...basePayload,
    context: {
      ...basePayload.context,
      user: {
        id: `doctor-${uuidv4()}`,
        name: "Doctor",
        moderator: true,
        affiliation: "owner",
      },
    },
  };

  const options = {
    algorithm: "RS256",
    header: { kid: KID },
  };

  const patientToken = jwt.sign(patientPayload, PRIVATE_KEY, options);
  const doctorToken = jwt.sign(doctorPayload, PRIVATE_KEY, options);

  return {
    roomName,
    patientJoinUrl: `${BASE_URL}/${roomName}?jwt=${patientToken}`,
    doctorJoinUrl: `${BASE_URL}/${roomName}?jwt=${doctorToken}`,
  };
};

export default generateJitsiSession;