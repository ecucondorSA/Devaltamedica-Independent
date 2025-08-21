'use client'

import { useState } from 'react'
import { 
  Settings, 
  Globe, 
  Bell, 
  Shield, 
  Database, 
  Mail,
  Save,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input } from '@altamedica/ui'
import { useToast } from '@/hooks/use-toast'

interface SystemSettings {
  general: {
    siteName: string
    siteUrl: string
    adminEmail: string
    timeZone: string
    language: string
  }
  email: {
    smtpHost: string
    smtpPort: string
    smtpUser: string
    smtpPassword: string
    fromEmail: string
    fromName: string
  }
  security: {
    sessionTimeout: number
    maxLoginAttempts: number
    passwordMinLength: number
    require2FA: boolean
    allowedIPs: string
  }
  notifications: {
    emailNotifications: boolean
    smsNotifications: boolean
    pushNotifications: boolean
    adminAlerts: boolean
  }
  database: {
    backupFrequency: string
    retentionDays: number
    autoCleanup: boolean
  }
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: 'AltaMedica Admin',
      siteUrl: 'https://admin.altamedica.com',
      adminEmail: 'admin@altamedica.com',
      timeZone: 'America/Mexico_City',
      language: 'es'
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      smtpUser: 'noreply@altamedica.com',
      smtpPassword: '********',
      fromEmail: 'noreply@altamedica.com',
      fromName: 'AltaMedica'
    },
    security: {
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      require2FA: true,
      allowedIPs: ''
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      adminAlerts: true
    },
    database: {
      backupFrequency: 'daily',
      retentionDays: 30,
      autoCleanup: true
    }
  })

  const handleSave = async () => {
    setLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: 'Success',
        description: 'Settings saved successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = (category: keyof SystemSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }))
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'database', label: 'Database', icon: Database }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Configure global system settings and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Basic configuration for the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Site Name</label>
                <Input
                  value={settings.general.siteName}
                  onChange={(e) => updateSettings('general', 'siteName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Site URL</label>
                <Input
                  value={settings.general.siteUrl}
                  onChange={(e) => updateSettings('general', 'siteUrl', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Email</label>
                <Input
                  type="email"
                  value={settings.general.adminEmail}
                  onChange={(e) => updateSettings('general', 'adminEmail', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Zone</label>
                <select
                  value={settings.general.timeZone}
                  onChange={(e) => updateSettings('general', 'timeZone', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="America/Mexico_City">Mexico City</option>
                  <option value="America/New_York">New York</option>
                  <option value="America/Los_Angeles">Los Angeles</option>
                  <option value="Europe/London">London</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Settings */}
      {activeTab === 'email' && (
        <Card>
          <CardHeader>
            <CardTitle>Email Configuration</CardTitle>
            <CardDescription>
              SMTP settings for sending system emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">SMTP Host</label>
                <Input
                  value={settings.email.smtpHost}
                  onChange={(e) => updateSettings('email', 'smtpHost', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SMTP Port</label>
                <Input
                  value={settings.email.smtpPort}
                  onChange={(e) => updateSettings('email', 'smtpPort', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SMTP Username</label>
                <Input
                  value={settings.email.smtpUser}
                  onChange={(e) => updateSettings('email', 'smtpUser', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SMTP Password</label>
                <Input
                  type="password"
                  value={settings.email.smtpPassword}
                  onChange={(e) => updateSettings('email', 'smtpPassword', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">From Email</label>
                <Input
                  type="email"
                  value={settings.email.fromEmail}
                  onChange={(e) => updateSettings('email', 'fromEmail', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">From Name</label>
                <Input
                  value={settings.email.fromName}
                  onChange={(e) => updateSettings('email', 'fromName', e.target.value)}
                />
              </div>
            </div>
            <div className="pt-4">
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Test Email Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>
              Configure security policies and access controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Session Timeout (minutes)</label>
                <Input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Login Attempts</label>
                <Input
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => updateSettings('security', 'maxLoginAttempts', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Password Length</label>
                <Input
                  type="number"
                  value={settings.security.passwordMinLength}
                  onChange={(e) => updateSettings('security', 'passwordMinLength', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Allowed IPs (comma-separated)</label>
                <Input
                  placeholder="Leave empty to allow all IPs"
                  value={settings.security.allowedIPs}
                  onChange={(e) => updateSettings('security', 'allowedIPs', e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="require2FA"
                checked={settings.security.require2FA}
                onChange={(e) => updateSettings('security', 'require2FA', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="require2FA" className="text-sm font-medium cursor-pointer">
                Require 2-Factor Authentication for all admin users
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Configure how and when to send notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.emailNotifications}
                  onChange={(e) => updateSettings('notifications', 'emailNotifications', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Email Notifications</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.smsNotifications}
                  onChange={(e) => updateSettings('notifications', 'smsNotifications', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">SMS Notifications</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.pushNotifications}
                  onChange={(e) => updateSettings('notifications', 'pushNotifications', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Push Notifications</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.adminAlerts}
                  onChange={(e) => updateSettings('notifications', 'adminAlerts', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Critical Admin Alerts</span>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database Settings */}
      {activeTab === 'database' && (
        <Card>
          <CardHeader>
            <CardTitle>Database Management</CardTitle>
            <CardDescription>
              Configure database backup and maintenance settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Backup Frequency</label>
                <select
                  value={settings.database.backupFrequency}
                  onChange={(e) => updateSettings('database', 'backupFrequency', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Retention Days</label>
                <Input
                  type="number"
                  value={settings.database.retentionDays}
                  onChange={(e) => updateSettings('database', 'retentionDays', parseInt(e.target.value))}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoCleanup"
                checked={settings.database.autoCleanup}
                onChange={(e) => updateSettings('database', 'autoCleanup', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="autoCleanup" className="text-sm font-medium cursor-pointer">
                Enable automatic database cleanup for old records
              </label>
            </div>
            <div className="pt-4 space-x-2">
              <Button variant="outline" size="sm">
                Backup Now
              </Button>
              <Button variant="outline" size="sm">
                Restore from Backup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}