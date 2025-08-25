'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Download,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui-stub';

interface QoSDashboardProps {
  doctorId?: string;
  sessionId?: string;
}

export function QoSDashboard({ doctorId, sessionId }: QoSDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch QoS reports
  const {
    data: reports,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['qos-reports', doctorId, selectedPeriod],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(doctorId && { doctorId }),
        startDate: getStartDate(selectedPeriod).toISOString(),
        endDate: new Date().toISOString(),
        limit: '100',
      });

      const response = await fetch(`/api/v1/telemedicine/qos/reports?${params}`);
      if (!response.ok) throw new Error('Failed to fetch QoS reports');
      return response.json();
    },
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30s if enabled
  });

  // Auto-refresh toggle
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => refetch(), 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetch]);

  const qualityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const qualityBadgeVariant = (score: number): any => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">QoS Dashboard</h2>
          <p className="text-muted-foreground">Monitor call quality and network performance</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold ${qualityScoreColor(reports?.aggregatedMetrics?.avgQualityScore || 0)}`}
              >
                {reports?.aggregatedMetrics?.avgQualityScore?.toFixed(1) || '-'}
              </span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <Badge variant={qualityBadgeVariant(reports?.aggregatedMetrics?.avgQualityScore || 0)}>
              {getQualityLabel(reports?.aggregatedMetrics?.avgQualityScore || 0)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {reports?.aggregatedMetrics?.avgLatency?.toFixed(0) || '-'}
              </span>
              <span className="text-sm text-muted-foreground">ms</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              {reports?.aggregatedMetrics?.avgLatency < 100 ? (
                <TrendingDown className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingUp className="h-3 w-3 text-red-600" />
              )}
              <span className="text-muted-foreground">
                {reports?.aggregatedMetrics?.avgLatency < 100 ? 'Good' : 'High'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Packet Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {reports?.aggregatedMetrics?.avgPacketLoss?.toFixed(1) || '-'}
              </span>
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              {reports?.aggregatedMetrics?.avgPacketLoss < 2 ? (
                <Wifi className="h-3 w-3 text-green-600" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-600" />
              )}
              <span className="text-muted-foreground">
                {reports?.aggregatedMetrics?.avgPacketLoss < 2 ? 'Stable' : 'Unstable'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {reports?.aggregatedMetrics?.totalSessions || 0}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDuration(reports?.aggregatedMetrics?.totalDuration || 0)} total
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="distribution">Quality Distribution</TabsTrigger>
          <TabsTrigger value="issues">Common Issues</TabsTrigger>
          <TabsTrigger value="sessions">Recent Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Metrics Over Time</CardTitle>
              <CardDescription>Network performance metrics for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={prepareTimelineData(reports?.reports)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="latency"
                    stroke="#8884d8"
                    name="Latency (ms)"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="jitter"
                    stroke="#82ca9d"
                    name="Jitter (ms)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="packetLoss"
                    stroke="#ff7300"
                    name="Packet Loss (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Quality Score Distribution</CardTitle>
              <CardDescription>Breakdown of session quality across all calls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={prepareQualityDistribution(
                        reports?.aggregatedMetrics?.qualityDistribution,
                      )}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareQualityDistribution(
                        reports?.aggregatedMetrics?.qualityDistribution,
                      ).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={QUALITY_COLORS[index % QUALITY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-4">
                  <h4 className="font-medium">Quality Breakdown</h4>
                  {prepareQualityDistribution(reports?.aggregatedMetrics?.qualityDistribution).map(
                    (item, index) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: QUALITY_COLORS[index] }}
                          />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.value}</span>
                          <span className="text-sm text-muted-foreground">
                            ({item.percentage}%)
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <CardTitle>Common Issues</CardTitle>
              <CardDescription>Most frequent quality problems detected</CardDescription>
            </CardHeader>
            <CardContent>
              {reports?.aggregatedMetrics?.commonIssues?.length > 0 ? (
                <div className="space-y-3">
                  {reports.aggregatedMetrics.commonIssues.map((issue: string, index: number) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{issue}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No issues detected in the selected period</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>Individual session quality metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reports?.reports?.map((report: any) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{report.patientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(report.startTime).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium">{formatDuration(report.duration)}</p>
                      </div>
                      <Badge variant={qualityBadgeVariant(report.qualityScore)}>
                        Score: {report.qualityScore}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions
function getStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

function getQualityLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Poor';
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function prepareTimelineData(reports: any[]): any[] {
  if (!reports) return [];
  return reports.map((r) => ({
    time: new Date(r.startTime).toLocaleDateString(),
    latency: r.avgLatency,
    jitter: r.avgJitter,
    packetLoss: r.avgPacketLoss,
  }));
}

function prepareQualityDistribution(distribution: any): any[] {
  if (!distribution) return [];
  const total = Object.values(distribution).reduce(
    (sum: number, val: any) => sum + val,
    0,
  ) as number;
  return [
    {
      name: 'Excellent',
      value: distribution.excellent,
      percentage: ((distribution.excellent / total) * 100).toFixed(1),
    },
    {
      name: 'Good',
      value: distribution.good,
      percentage: ((distribution.good / total) * 100).toFixed(1),
    },
    {
      name: 'Fair',
      value: distribution.fair,
      percentage: ((distribution.fair / total) * 100).toFixed(1),
    },
    {
      name: 'Poor',
      value: distribution.poor,
      percentage: ((distribution.poor / total) * 100).toFixed(1),
    },
  ];
}

const QUALITY_COLORS = ['#10b981', '#eab308', '#f97316', '#ef4444'];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
  const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};
