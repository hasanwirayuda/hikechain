import admin from "firebase-admin";

let initialized = false;

export const initFirebase = (): void => {
  if (initialized) return;
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY) {
    console.warn(
      "[Firebase] Credentials not set — push notifications disabled",
    );
    return;
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
  initialized = true;
  console.log("[Firebase] Initialized");
};

export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> => {
  if (!initialized) return;
  try {
    await admin
      .messaging()
      .send({ token: fcmToken, notification: { title, body }, data });
  } catch (err) {
    console.error("[FCM] Failed:", err);
  }
};
