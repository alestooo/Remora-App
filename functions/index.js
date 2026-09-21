const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

const costaRicaDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const addDays = (date, days) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

exports.sendTaskReminders = onSchedule(
  {
    schedule: "every 15 minutes",
    timeZone: "America/Costa_Rica",
    region: "us-central1",
  },
  async () => {
    const now = new Date();
    const dateKeys = [
      costaRicaDateKey(now),
      costaRicaDateKey(addDays(now, 1)),
    ];

    const snapshot = await db
      .collectionGroup("tasks")
      .where("date", "in", dateKeys)
      .get();

    const notificationCache = new Map();
    const promises = [];

    for (const taskDoc of snapshot.docs) {
      const task = taskDoc.data();
      if (task.completed || task.archived || !task.date) continue;

      const uid = taskDoc.ref.parent.parent?.id;
      if (!uid) continue;

      let settings = notificationCache.get(uid);
      if (!settings) {
        const notificationDoc = await db
          .doc(`users/${uid}/meta/notifications`)
          .get();
        settings = notificationDoc.exists ? notificationDoc.data() : null;
        notificationCache.set(uid, settings);
      }

      if (!settings?.enabled || !settings?.fcmToken) continue;

      const time = task.time || "23:59";
      const due = new Date(`${task.date}T${time}:00-06:00`);
      const minutesLeft = Math.floor((due.getTime() - now.getTime()) / 60000);
      const minutesBefore = Number(settings.notifyMinutesBefore || 120);

      if (minutesLeft < 0 || minutesLeft > minutesBefore) continue;

      const reminderKey = `${task.date}|${time}|${minutesBefore}`;
      if (task.reminderKey === reminderKey) continue;

      const body = minutesLeft <= 60
        ? `“${task.title}” vence en aproximadamente ${Math.max(1, minutesLeft)} minutos.`
        : `“${task.title}” vence hoy a las ${time}.`;

      promises.push(
        messaging
          .send({
            token: settings.fcmToken,
            notification: {
              title: "Remora · Próxima entrega",
              body,
            },
            data: {
              taskId: taskDoc.id,
              type: task.type || "Tarea",
            },
          })
          .then(() =>
            taskDoc.ref.update({
              reminderKey,
              reminderSentAt: FieldValue.serverTimestamp(),
            })
          )
          .catch(async (error) => {
            console.error("FCM error", uid, taskDoc.id, error);
            if (
              error.code === "messaging/registration-token-not-registered" ||
              error.code === "messaging/invalid-registration-token"
            ) {
              await db.doc(`users/${uid}/meta/notifications`).set(
                { enabled: false, fcmToken: null, updatedAt: FieldValue.serverTimestamp() },
                { merge: true }
              );
            }
          })
      );
    }

    await Promise.all(promises);
  }
);
