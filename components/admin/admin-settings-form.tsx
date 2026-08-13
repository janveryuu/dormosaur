'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ListGroup, ListRow } from '@/components/ios/list-group'
import { Bell, Mail, Shield, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react'

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
  const [isSaving, setIsSaving] = useState(false)

  const handleToggle = async (key: keyof typeof settings) => {
    const nextVal = !settings[key]
    const updated = { ...settings, [key]: nextVal }
    setSettings(updated)
    setIsSaving(true)
    setSavedStatus(null)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      if (res.ok) {
        setSavedStatus('Settings saved to database')
        setTimeout(() => setSavedStatus(null), 3000)
      }
    } catch (err) {
      console.error('Failed to update admin settings:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {savedStatus && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4" />
          <span>{savedStatus}</span>
        </div>
      )}

      <ListGroup title="Notifications & Alert Dispatch">
        <ListRow
          icon={<Bell className="size-4" />}
          label="Alarm failure alerts"
          detail="Send instant push/email alerts to admins when scheduled class alarms fail."
          trailing={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/40">Functional</Badge>
              <Switch
                checked={settings.alarm_failure_alerts}
                onCheckedChange={() => handleToggle('alarm_failure_alerts')}
                disabled={isSaving}
              />
            </div>
          }
        />
        <ListRow
          icon={<Mail className="size-4" />}
          label="Weekly digest email"
          detail="Automatically trigger weekly schedule & meal prep digests every Sunday."
          trailing={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/40">Functional</Badge>
              <Switch
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
          detail="Receive realtime notifications when new students complete onboarding."
          trailing={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] text-muted-foreground">UI Toggle Saved</Badge>
              <Switch
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
          detail="Enforce TOTP multi-factor verification on all administrative login sessions."
          trailing={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/40">Policy Saved</Badge>
              <Switch
                checked={settings.require_2fa}
                onCheckedChange={() => handleToggle('require_2fa')}
                disabled={isSaving}
              />
            </div>
          }
        />
        <ListRow
          icon={<AlertTriangle className="size-4" />}
          label="Auto-suspend on payment failure"
          detail="Automatically pause premium features if subscription payment fails."
          trailing={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] text-muted-foreground">Placeholder (No Payments Yet)</Badge>
              <Switch
                checked={settings.auto_suspend_payment}
                onCheckedChange={() => handleToggle('auto_suspend_payment')}
                disabled={isSaving}
              />
            </div>
          }
        />
        <ListRow
          icon={<RefreshCw className="size-4" />}
          label="Auto-sync currency exchange rates"
          detail="Sync global fiat exchange rates daily for localized recipe pricing."
          trailing={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/40">Functional</Badge>
              <Switch
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
