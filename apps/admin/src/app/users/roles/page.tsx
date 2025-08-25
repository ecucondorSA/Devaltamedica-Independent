'use client';

import { useState } from 'react';
import { Shield, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from '@altamedica/ui';
import { useToast } from '../../../hooks/use-toast';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const systemRoles: Role[] = [
  {
    id: '1',
    name: 'super-admin',
    description: 'Full system access with all permissions',
    permissions: ['*'],
    userCount: 2,
    isSystem: true,
  },
  {
    id: '2',
    name: 'admin',
    description: 'Administrative access with most permissions',
    permissions: ['users:read', 'users:write', 'reports:read', 'settings:read'],
    userCount: 5,
    isSystem: true,
  },
  {
    id: '3',
    name: 'doctor',
    description: 'Medical professional with patient access',
    permissions: ['patients:read', 'patients:write', 'appointments:manage', 'prescriptions:write'],
    userCount: 150,
    isSystem: true,
  },
  {
    id: '4',
    name: 'patient',
    description: 'Basic user with personal data access',
    permissions: ['profile:read', 'profile:write', 'appointments:read'],
    userCount: 1200,
    isSystem: true,
  },
];

const availablePermissions: Permission[] = [
  // User Management
  { id: 'p1', name: 'users:read', description: 'View user information', category: 'Users' },
  { id: 'p2', name: 'users:write', description: 'Create and edit users', category: 'Users' },
  { id: 'p3', name: 'users:delete', description: 'Delete users', category: 'Users' },

  // Patient Management
  { id: 'p4', name: 'patients:read', description: 'View patient records', category: 'Patients' },
  { id: 'p5', name: 'patients:write', description: 'Edit patient records', category: 'Patients' },
  {
    id: 'p6',
    name: 'patients:delete',
    description: 'Delete patient records',
    category: 'Patients',
  },

  // Appointments
  {
    id: 'p7',
    name: 'appointments:read',
    description: 'View appointments',
    category: 'Appointments',
  },
  {
    id: 'p8',
    name: 'appointments:manage',
    description: 'Create and manage appointments',
    category: 'Appointments',
  },

  // Medical
  { id: 'p9', name: 'prescriptions:read', description: 'View prescriptions', category: 'Medical' },
  {
    id: 'p10',
    name: 'prescriptions:write',
    description: 'Create prescriptions',
    category: 'Medical',
  },
  {
    id: 'p11',
    name: 'medical:records',
    description: 'Access medical records',
    category: 'Medical',
  },

  // Reports
  { id: 'p12', name: 'reports:read', description: 'View reports', category: 'Reports' },
  { id: 'p13', name: 'reports:generate', description: 'Generate reports', category: 'Reports' },
  { id: 'p14', name: 'reports:export', description: 'Export reports', category: 'Reports' },

  // Settings
  { id: 'p15', name: 'settings:read', description: 'View settings', category: 'Settings' },
  { id: 'p16', name: 'settings:write', description: 'Modify settings', category: 'Settings' },

  // System
  {
    id: 'p17',
    name: 'system:monitoring',
    description: 'Access system monitoring',
    category: 'System',
  },
  { id: 'p18', name: 'system:audit', description: 'View audit logs', category: 'System' },
  { id: 'p19', name: 'system:maintenance', description: 'Perform maintenance', category: 'System' },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(systemRoles);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const { toast } = useToast();

  const handleCreateRole = () => {
    if (!newRoleName || !newRoleDescription) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    const newRole: Role = {
      id: Date.now().toString(),
      name: newRoleName.toLowerCase().replace(/\s+/g, '-'),
      description: newRoleDescription,
      permissions: selectedPermissions,
      userCount: 0,
      isSystem: false,
    };

    setRoles([...roles, newRole]);
    setShowCreateRole(false);
    setNewRoleName('');
    setNewRoleDescription('');
    setSelectedPermissions([]);

    toast({
      title: 'Success',
      description: 'Role created successfully',
    });
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (role?.isSystem) {
      toast({
        title: 'Error',
        description: 'Cannot delete system roles',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this role?')) return;

    setRoles(roles.filter((r) => r.id !== roleId));
    toast({
      title: 'Success',
      description: 'Role deleted successfully',
    });
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission],
    );
  };

  const getPermissionsByCategory = () => {
    const grouped: { [key: string]: Permission[] } = {};
    availablePermissions.forEach((perm) => {
      if (!grouped[perm.category]) {
        grouped[perm.category] = [];
      }
      grouped[perm.category].push(perm);
    });
    return grouped;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Manage user roles and their associated permissions
          </p>
        </div>
        <Button onClick={() => setShowCreateRole(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Role
        </Button>
      </div>

      {/* Create Role Form */}
      {showCreateRole && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Role Name</label>
              <Input
                placeholder="e.g., content-editor"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Describe the role's purpose"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Permissions</label>
              <div className="space-y-4">
                {Object.entries(getPermissionsByCategory()).map(([category, perms]) => (
                  <div key={category}>
                    <h4 className="font-medium text-sm mb-2">{category}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map((perm) => (
                        <label key={perm.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm.name)}
                            onChange={() => togglePermission(perm.name)}
                            className="rounded"
                          />
                          <span className="text-sm">{perm.description}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateRole(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRole}>Create Role</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles List */}
      <div className="grid gap-4">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">{role.name}</h3>
                    {role.isSystem && (
                      <Badge variant="outline" className="text-xs">
                        System
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{role.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                    <span>{role.userCount} users</span>
                    <span>•</span>
                    <span>{role.permissions.length} permissions</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!role.isSystem && (
                    <>
                      <Button size="sm" variant="outline">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteRole(role.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Permissions */}
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Permissions:</p>
                <div className="flex flex-wrap gap-2">
                  {role.permissions[0] === '*' ? (
                    <Badge className="bg-red-100 text-red-800">All Permissions</Badge>
                  ) : (
                    role.permissions.map((perm) => (
                      <Badge key={perm} variant="secondary" className="text-xs">
                        {perm}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
