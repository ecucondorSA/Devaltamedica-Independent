'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Save, User } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { useToast } from '@altamedica/ui';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@altamedica/ui';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'company' | 'admin' | 'super-admin';
  status: 'active' | 'inactive' | 'suspended';
  phoneNumber?: string;
  address?: string;
  createdAt: string;
  lastLogin: string;
  permissions?: string[];
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'patient',
    status: 'active',
    phoneNumber: '',
    address: '',
    password: '',
  });

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/v1/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch user');

      const data: { user: UserData } = await response.json();
      setUser(data.user);
      setFormData({
        name: data.user.name || '',
        email: data.user.email || '',
        role: data.user.role || 'patient',
        status: data.user.status || 'active',
        phoneNumber: data.user.phoneNumber || '',
        address: data.user.address || '',
        password: '',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load user data',
        variant: 'destructive',
      });
      router.push('/users');
    } finally {
      setLoading(false);
    }
  }, [userId, router, toast]);

  useEffect(() => {
    if (userId && userId !== 'new') {
      void fetchUser();
    } else if (userId === 'new') {
      // Initialize form for new user
      setFormData({
        name: '',
        email: '',
        role: 'patient',
        status: 'active',
        phoneNumber: '',
        address: '',
        password: '',
      });
      setLoading(false);
    }
  }, [userId, fetchUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url =
        userId === 'new'
          ? 'http://localhost:3001/api/v1/users'
          : `http://localhost:3001/api/v1/users/${userId}`;

      const method = userId === 'new' ? 'POST' : 'PUT';

      const body =
        userId === 'new'
          ? formData
          : {
              name: formData.name,
              email: formData.email,
              role: formData.role,
              status: formData.status,
              phoneNumber: formData.phoneNumber,
              address: formData.address,
            };

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to save user');

      toast({
        title: 'Success',
        description: userId === 'new' ? 'User created successfully' : 'User updated successfully',
      });

      router.push('/users');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to save user',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/users')} type="button">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
          <h1 className="text-2xl font-bold">
            {userId === 'new' ? 'Add New User' : 'Edit User'}
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>User Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name *
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address *
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  placeholder="john@example.com"
                  disabled={userId !== 'new'}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">
                  Role *
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  className="w-full rounded-md border px-3 py-2"
                  required
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="company">Company</option>
                  <option value="admin">Admin</option>
                  <option value="super-admin">Super Admin</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">
                  Status *
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full rounded-md border px-3 py-2"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="text-sm font-medium">
                  Phone Number
                </label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Address
                </label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="123 Main St, City, Country"
                />
              </div>
            </div>

            {userId === 'new' && (
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Initial Password *
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  required
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  User will be required to change password on first login
                </p>
              </div>
            )}

            {user && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Created:</span>{' '}
                    {new Date(user.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Last Login:</span>{' '}
                    {new Date(user.lastLogin).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={() => router.push('/users')}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
