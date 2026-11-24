'use client'

import { useEffect, useRef, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ListGroup, ListRow } from '@/components/ios/list-group'
import { Bell, Mail, Shield, AlertTriangle, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'

interface AdminSettingsFormProps {
  initialSettings: {
    alarm_failure_alerts: boolean
    weekly_digest_email: boolean
    new_signup_notifs: boolean
    require_2fa: boolean
    auto_suspend_payment: boolean
    auto_sync_exchange: boolean
  }
}

export function AdminSettingsForm({ initialSettings }: AdminSettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [savedStatus, setSavedStatus] = useState<string | null>(null)
  const [errorStatus, setErrorStatus] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleToggle = async (key: keyof typeof settings) => {
    const prev = settings
    const updated = { ...settings, [key]: !settings[key] }
    setSettings(updated)
    setIsSaving(true)
    setSavedStatus(null)
    setErrorStatus(null)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSettings(prev)
        setErrorStatus(json.error || 'Could not save settings. Reverted change.')
        return
      }
      setSavedStatus('Settings saved to database')
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setSavedStatus(null), 3000)
    } catch {
      setSettings(prev)
      setErrorStatus('Network error while saving settings. Reverted change.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {savedStatus && (
        <div role="status" className="flex items-center gap-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4" />
          <span>{savedStatus}</span>
        </div>
      )}
      {errorStatus && (
        <div role="alert" className="flex items-center gap-2 rounded-2xl bg-destructive/15 border border-destructive/30 p-3 text-xs font-bold text-destructive">
          <AlertCircle className="size-4" />
          <span>{errorStatus}</span>
        </div>
      )}

      <ListGroup title="Notifications & Alert Preferences">
        <ListRow
          icon={<Bell className="size-4" />}
          label="Alarm failure alerts"
          detail="Store preference for alerting admins when scheduled class alarms fail."
          trailing={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] text-muted-foreground">Saved config</Badge>
              <Switch
                aria-label="Alarm failure alerts"
                checked={settings.alarm_failure_alerts}
                onCheckedChange={() => handleToggle('alarm_failure_alerts')}
                disabled={isSaving}
              />
            </div>
          }
        />
        <ListRow
          icon={<Mail className="size-4" />}
          label="Weekly digest summary"
          detail="Store preference for automated weekly schedule & meal prep digests."
          trailing={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] text-muted-foreground">Saved config</Badge>
              <Switch
                aria-label="Weekly digest summary"
                checked={settings.weekly_digest_email}
                onCheckedChange={() => handleToggle('weekly_digest_email')}
                disabled={isSaving}
              />
            </div>
          }
        />
        <ListRow
          icon={<Bell className="size-4" />}
          label="New signup notifications"
          detail="Store preference for notifying admins when students complete onboarding."
          trailing={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] text-muted-foreground">Saved config</Badge>
              <Switch
                aria-label="New signup notifications"
                checked={settings.new_signup_notifs}
                onCheckedChange={() => handleToggle('new_signup_notifs')}
                disabled={isSaving}
              />
            </div>
          }
        />
      </ListGroup>

      <ListGroup title="Security & Automated Policies">
        <ListRow
          icon={<Shield className="size-4" />}
          label="Require 2-Factor Authentication for Admins"
          detail="Saved policy flag for administrative multi-factor enforcement."
          trailing={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] text-muted-foreground">Saved config</Badge>
              <Switch
                aria-label="Require 2-Factor Authentication for Admins"
                checked={settings.require_2fa}
                onCheckedChange={() => handleToggle('require_2fa')}
                disabled={isSaving}
              />
            </div>
          }
        />
        <ListRow
          icon={<AlertTriangle className="size-4" />}
          label="Auto-revoke on rejected payment"
          detail="Saved policy flag for manual QR receipt review automation."
          trailing={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] text-muted-foreground">Saved config</Badge>
              <Switch
                aria-label="Auto-revoke on rejected payment"
                checked={settings.auto_suspend_payment}
                onCheckedChange={() => handleToggle('auto_suspend_payment')}
                disabled={isSaving}
              />
            </div>
          }
        />
        <ListRow
          icon={<RefreshCw className="size-4" />}
          label="Localized pricing sync"
          detail="Store preference for future non-PHP currency catalog localization."
          trailing={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] text-muted-foreground">Saved config</Badge>
              <Switch
                aria-label="Localized pricing sync"
                checked={settings.auto_sync_exchange}
                onCheckedChange={() => handleToggle('auto_sync_exchange')}
                disabled={isSaving}
              />
            </div>
          }
        />
      </ListGroup>
    </div>
  )
}
