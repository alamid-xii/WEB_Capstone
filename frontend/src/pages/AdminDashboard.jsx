import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  MapPin,
  Users,
  MessageSquare,
  MapPinned,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Menu,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";

const stats = [
  {
    label: "Total Users",
    value: "2,847",
    change: "+12.5%",
    trend: "up",
    icon: Users,
  },
  {
    label: "Active Sessions",
    value: "428",
    change: "+8.2%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    label: "Q&A Queries",
    value: "1,523",
    change: "+23.1%",
    trend: "up",
    icon: MessageSquare,
  },
  {
    label: "AR Navigation Uses",
    value: "689",
    change: "+15.7%",
    trend: "up",
    icon: MapPinned,
  },
];

const recentActivities = [
  {
    id: 1,
    user: "Maria Santos",
    action: "Started AR campus tour",
    time: "2 minutes ago",
    status: "active",
  },
  {
    id: 2,
    user: "John Reyes",
    action: "Completed enrollment form",
    time: "15 minutes ago",
    status: "completed",
  },
  {
    id: 3,
    user: "Ana Garcia",
    action: "Asked Q&A about admission requirements",
    time: "1 hour ago",
    status: "completed",
  },
  {
    id: 4,
    user: "Pedro Cruz",
    action: "Viewed campus map",
    time: "2 hours ago",
    status: "completed",
  },
  {
    id: 5,
    user: "Lisa Fernandez",
    action: "Downloaded enrollment guide",
    time: "3 hours ago",
    status: "completed",
  },
];

const systemAlerts = [
  {
    id: 1,
    type: "warning",
    message: "High server load detected - response time increased by 15%",
    time: "10 minutes ago",
  },
  {
    id: 2,
    type: "success",
    message: "Database backup completed successfully",
    time: "1 hour ago",
  },
  {
    id: 3,
    type: "info",
    message: "New feature deployment scheduled for March 10, 2026",
    time: "3 hours ago",
  },
];

export function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  const sidebarLinks = [
    { icon: BarChart3, label: "Dashboard", active: true },
    { icon: Users, label: "Users", active: false },
    { icon: MessageSquare, label: "Q&A Management", active: false },
    { icon: MapPinned, label: "AR Content", active: false },
    { icon: FileText, label: "Content Editor", active: false },
    { icon: Settings, label: "Settings", active: false },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF0]">
      {/* Top Navigation */}
      <header className="bg-[#001840] text-white shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          {/* Logo & Menu Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-[#102A71] rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-[#F5C400] w-9 h-9 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#001840]" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg tracking-wide">
                  UniNav Admin
                </span>
                <p className="text-[8px] text-[#FFDC5F] leading-none tracking-widest uppercase">
                  Eastern Mindoro College
                </p>
              </div>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFDC5F]" />
              <Input
                type="search"
                placeholder="Search users, content, or settings..."
                className="pl-10 bg-[#102A71] border-[#102A71] text-white placeholder:text-[#FFDC5F]/60 focus:bg-[#001840]"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-[#102A71] rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#F5C400] rounded-full"></span>
            </button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="hidden sm:flex text-white hover:bg-[#102A71] hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#102A71]/10 transition-transform duration-300 ease-in-out mt-16 lg:mt-0`}
        >
          <nav className="p-4 space-y-2">
            {sidebarLinks.map((link) => (
              <button
                key={link.label}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  link.active
                    ? "bg-[#102A71] text-white"
                    : "text-[#001840] hover:bg-[#F5C400]/10"
                }`}
              >
                <link.icon className="w-5 h-5" />
                <span className="font-medium">{link.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30 mt-16"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#001840] mb-2">
              Dashboard Overview
            </h1>
            <p className="text-[#102A71]">
              Monitor and manage UniNav Admission System
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-[#102A71]/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-[#F5C400]/10 p-3 rounded-lg">
                      <stat.icon className="w-6 h-6 text-[#102A71]" />
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 hover:bg-green-100"
                    >
                      {stat.change}
                    </Badge>
                  </div>
                  <h3 className="text-2xl font-bold text-[#001840] mb-1">
                    {stat.value}
                  </h3>
                  <p className="text-sm text-[#102A71]">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <Card className="lg:col-span-2 border-[#102A71]/10">
              <CardHeader>
                <CardTitle className="text-[#001840]">
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest user interactions with UniNav
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 pb-4 border-b border-[#102A71]/10 last:border-0 last:pb-0"
                    >
                      <div
                        className={`mt-1 ${
                          activity.status === "active"
                            ? "bg-green-100"
                            : "bg-[#F5C400]/10"
                        } p-2 rounded-lg`}
                      >
                        {activity.status === "active" ? (
                          <Clock className="w-4 h-4 text-green-600" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-[#102A71]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#001840]">
                          {activity.user}
                        </p>
                        <p className="text-sm text-[#102A71]">
                          {activity.action}
                        </p>
                        <p className="text-xs text-[#102A71]/60 mt-1">
                          {activity.time}
                        </p>
                      </div>
                      {activity.status === "active" && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700 hover:bg-green-100"
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Alerts */}
            <Card className="border-[#102A71]/10">
              <CardHeader>
                <CardTitle className="text-[#001840]">
                  System Alerts
                </CardTitle>
                <CardDescription>Important notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border ${
                        alert.type === "warning"
                          ? "bg-orange-50 border-orange-200"
                          : alert.type === "success"
                          ? "bg-green-50 border-green-200"
                          : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <AlertCircle
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            alert.type === "warning"
                              ? "text-orange-600"
                              : alert.type === "success"
                              ? "text-green-600"
                              : "text-blue-600"
                          }`}
                        />
                        <p
                          className={`text-sm font-medium ${
                            alert.type === "warning"
                              ? "text-orange-900"
                              : alert.type === "success"
                              ? "text-green-900"
                              : "text-blue-900"
                          }`}
                        >
                          {alert.message}
                        </p>
                      </div>
                      <p
                        className={`text-xs ${
                          alert.type === "warning"
                            ? "text-orange-700"
                            : alert.type === "success"
                            ? "text-green-700"
                            : "text-blue-700"
                        }`}
                      >
                        {alert.time}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-[#001840] mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto py-6 flex-col gap-2 border-[#102A71]/20 hover:bg-[#F5C400]/10 hover:border-[#F5C400]"
              >
                <Users className="w-6 h-6 text-[#102A71]" />
                <span className="text-[#001840]">Add User</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex-col gap-2 border-[#102A71]/20 hover:bg-[#F5C400]/10 hover:border-[#F5C400]"
              >
                <FileText className="w-6 h-6 text-[#102A71]" />
                <span className="text-[#001840]">Edit Content</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex-col gap-2 border-[#102A71]/20 hover:bg-[#F5C400]/10 hover:border-[#F5C400]"
              >
                <MapPinned className="w-6 h-6 text-[#102A71]" />
                <span className="text-[#001840]">Update Map</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex-col gap-2 border-[#102A71]/20 hover:bg-[#F5C400]/10 hover:border-[#F5C400]"
              >
                <Settings className="w-6 h-6 text-[#102A71]" />
                <span className="text-[#001840]">Settings</span>
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
