import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { registerExpoPushToken } from './api'
import type { Alarm, ClassEntry } from './repo'
import { DAYS } from './repo'
import { formatTime, minutesOf } from './time'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function ensurePermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('classes', {
      name: 'Class alarms',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
    })
  }
  const current = await Notifications.getPermissionsAsync()
  if (current.granted) return true
  const next = await Notifications.requestPermissionsAsync()
  return next.granted
}

/**
 * Re-schedules every enabled class alarm as a weekly local notification.
 * Local scheduling keeps alarms working offline and without a server round-trip.
 */
export async function syncAlarmNotifications(alarms: Alarm[], classes: ClassEntry[]) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  await Promise.all(scheduled
    .filter(notification => notification.content.data?.alarmId)
    .map(notification => Notifications.cancelScheduledNotificationAsync(notification.identifier)))
  const enabled = alarms.filter(a => a.enabled)
  if (!enabled.length || !(await ensurePermission())) return

  for (const alarm of enabled) {
    const cls = classes.find(c => c.id === alarm.classId)
    const days = cls ? cls.days : DAYS.includes(alarm.day as never) ? [alarm.day] : []
    const start = cls?.start || alarm.time
    if (!start) continue
    const fireAt = minutesOf(start) - alarm.lead
    const dayShift = fireAt < 0 ? -1 : 0
    const minutes = (fireAt + 1440) % 1440

    for (const day of days) {
      const index = (DAYS.indexOf(day as never) + dayShift + 7) % 7
      await Notifications.scheduleNotificationAsync({
        content: {
          title: alarm.subject || cls?.subject || 'Class',
          body: `${formatTime(start)}${cls?.room ? ` · ${cls.room}` : ''}`,
          data: { alarmId: alarm.id, classId: alarm.classId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          // Expo weekday: 1 = Sunday … 7 = Saturday. DAYS index: 0 = Monday.
          weekday: ((index + 1) % 7) + 1,
          hour: Math.floor(minutes / 60),
          minute: minutes % 60,
          channelId: 'classes',
        },
      })
    }
  }
}

const kitchenNotificationQueues = new Map<string, Promise<void>>()

export function updateKitchenNotification(identifier: string, title: string, step: number, endsAt: number) {
  if (Platform.OS === 'web') return
  const previous = kitchenNotificationQueues.get(identifier) ?? Promise.resolve()
  const ready = previous.then(async () => {
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {})
    if (endsAt - Date.now() < 1000 || !(await Notifications.getPermissionsAsync()).granted) return
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('kitchen-timers', {
        name: 'Kitchen timers',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 150, 250],
      })
    }
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: { title, body: `Step ${step + 1} timer finished`, sound: 'default', data: { kitchenTimer: true } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(endsAt), channelId: 'kitchen-timers' },
    })
  }).catch(() => {})
  kitchenNotificationQueues.set(identifier, ready)
  void ready.then(() => { if (kitchenNotificationQueues.get(identifier) === ready) kitchenNotificationQueues.delete(identifier) })
}

/**
 * Registers for server push (deadline reminders from the Vercel cron).
 * Class alarms stay local; the server skips class reminders for Expo devices.
 * Needs FCM credentials uploaded to EAS for Android; failures are silent.
 */
export async function registerForServerPush() {
  try {
    if (!Device.isDevice || !(await ensurePermission())) return
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined
    if (!projectId) return
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
    await registerExpoPushToken(token, Device.modelName ?? 'Android')
  } catch (e) {
    console.warn('[push] registration skipped', (e as Error)?.message)
  }
}
