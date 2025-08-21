import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content can include any elements</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const PatientCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Juan Pérez</CardTitle>
          <Badge variant="success">Active</Badge>
        </div>
        <CardDescription>Patient ID: #12345</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Age</span>
          <span className="text-sm font-medium">45 years</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Blood Type</span>
          <span className="text-sm font-medium">O+</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Last Visit</span>
          <span className="text-sm font-medium">2024-01-15</span>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button size="sm">View History</Button>
        <Button size="sm" variant="outline">Schedule</Button>
      </CardFooter>
    </Card>
  ),
};

export const AppointmentCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Dr. María García</CardTitle>
          <Badge variant="info">Scheduled</Badge>
        </div>
        <CardDescription>Cardiology Consultation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📅</span>
          <div>
            <p className="text-sm font-medium">February 15, 2024</p>
            <p className="text-xs text-muted-foreground">10:30 AM - 11:30 AM</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">📍</span>
          <div>
            <p className="text-sm">Consultation Room 3</p>
            <p className="text-xs text-muted-foreground">Building A, 2nd Floor</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button size="sm" variant="medical">Join Video Call</Button>
        <Button size="sm" variant="outline">Reschedule</Button>
      </CardFooter>
    </Card>
  ),
};

export const MetricCard: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">1,234</p>
          <p className="text-xs text-muted-foreground">+12% from last month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Appointments Today</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">24</p>
          <p className="text-xs text-muted-foreground">6 completed</p>
        </CardContent>
      </Card>
    </div>
  ),
};