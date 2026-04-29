import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import {
  MapPin, Users, MessageSquare, FileText, BarChart3, Settings, LogOut,
  Bell, Search, TrendingUp, AlertCircle, CheckCircle2, Clock, Menu, X,
  Plus, Edit, Trash2, Eye, Building2, Home, Target, BookOpen,
  CheckCircle, XCircle, Download, Calendar, Filter, ChevronLeft, ChevronRight
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { AcademicSetup } from "../components/admin/AcademicSetup";
import { SectionManagement } from "./SectionManagement";

export function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [faqs, setFAQs] = useState([]);
  const [users, setUsers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [showFAQForm, setShowFAQForm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Open the tab passed via router state (e.g. coming back from enrollment detail)
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  useEffect(() => {
    // Check if user is logged in and is admin
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");
    
    if (!user.email || user.role !== "admin" || !token) {
      navigate("/login");
      return;
    }
    
    fetchDashboardData();
  }, [navigate]);

  async function fetchDashboardData() {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const [statsRes, faqsRes, usersRes, buildingsRes] = await Promise.all([
        fetch("http://localhost:3000/api/admin/stats", { headers }),
        fetch("http://localhost:3000/api/admin/faqs", { headers }),
        fetch("http://localhost:3000/api/admin/users", { headers }),
        fetch("http://localhost:3000/api/buildings", { headers })
      ]);

      if (statsRes.status === 401 || statsRes.status === 403) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const [statsData, faqsData, usersData, buildingsData] = await Promise.all([
        statsRes.json(),
        faqsRes.json(),
        usersRes.json(),
        buildingsRes.json()
      ]);

      setStats(statsData.stats);
      setFAQs(faqsData);
      setUsers(usersData);
      setBuildings(buildingsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateFAQ(faqData) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/api/admin/faqs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(faqData)
      });

      if (response.ok) {
        fetchDashboardData();
        setShowFAQForm(false);
      }
    } catch (error) {
      console.error("Error creating FAQ:", error);
    }
  }

  async function handleUpdateFAQ(id, faqData) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/api/admin/faqs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(faqData)
      });

      if (response.ok) {
        fetchDashboardData();
        setEditingFAQ(null);
      }
    } catch (error) {
      console.error("Error updating FAQ:", error);
    }
  }

  async function handleDeleteFAQ(id) {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/api/admin/faqs/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error deleting FAQ:", error);
    }
  }

  const menuItems = [
    { id: "dashboard",  label: "Dashboard",          icon: BarChart3  },
    { id: "enrollments",label: "Enrollments",         icon: FileText   },
    { id: "sections",   label: "Section Management",  icon: Users      },
    { id: "academic",   label: "Academic Setup",      icon: BookOpen   },
    { id: "faqs",       label: "Manage FAQs",         icon: MessageSquare },
    { id: "users",      label: "Manage Users",        icon: Users      },
    { id: "buildings",  label: "Manage Buildings",    icon: Building2  },
    { id: "settings",   label: "Settings",            icon: Settings   },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#F5C400] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF0] flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#001840] text-white transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-[#102A71]">
            <div className="flex items-center gap-3">
              <div className="bg-[#F5C400] w-10 h-10 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-[#001840]" />
              </div>
              <div>
                <h1 className="font-bold text-lg">UniNav Admin</h1>
                <p className="text-xs text-[#FFDC5F]">Eastern Mindoro College</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? "bg-[#F5C400] text-[#001840]"
                      : "text-[#FFFDF0] hover:bg-[#102A71]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-[#102A71]">
            <Link
              to="/"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#FFFDF0] hover:bg-[#102A71] transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Back to Site</span>
            </Link>
            <button
              onClick={async () => {
                try {
                  await fetch("http://localhost:3000/api/auth/logout", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                  });
                } catch (error) {
                  console.error("Logout error:", error);
                }
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                navigate("/login");
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-300 hover:bg-red-900/20 transition-colors mt-1"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <h2 className="text-xl font-bold text-gray-900">
                {menuItems.find((m) => m.id === activeTab)?.label}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-10 h-10 bg-[#001840] rounded-full flex items-center justify-center text-white font-semibold">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-8">
          {activeTab === "dashboard" && <DashboardView stats={stats} />}
          {activeTab === "faqs" && (
            <FAQsView
              faqs={faqs}
              onDelete={handleDeleteFAQ}
              onEdit={setEditingFAQ}
              onAdd={() => setShowFAQForm(true)}
              editingFAQ={editingFAQ}
              showForm={showFAQForm}
              onSave={editingFAQ ? handleUpdateFAQ : handleCreateFAQ}
              onCancel={() => {
                setEditingFAQ(null);
                setShowFAQForm(false);
              }}
            />
          )}
          {activeTab === "users" && <UsersView users={users} />}
          {activeTab === "enrollments" && <EnrollmentsView />}
          {activeTab === "sections" && <SectionManagement />}
          {activeTab === "buildings" && <BuildingsView buildings={buildings} onRefresh={fetchDashboardData} />}
          {activeTab === "academic" && <AcademicSetup />}
          {activeTab === "settings" && <SettingsView />}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}

// ── Status config ─────────────────────────────────────────────────────────────
const ADMIN_STATUS_CFG = {
  draft:             { label: 'Draft',             color: 'bg-gray-100 text-gray-700' },
  submitted:         { label: 'Submitted',          color: 'bg-blue-100 text-blue-700' },
  pending_exam:      { label: 'Pending Exam',       color: 'bg-yellow-100 text-yellow-700' },
  verified:          { label: 'Verified',           color: 'bg-purple-100 text-purple-700' },
  returned:          { label: 'Returned',           color: 'bg-orange-100 text-orange-700' },
  approved:          { label: 'Approved',           color: 'bg-green-100 text-green-700' },
  subjects_enrolled: { label: 'Subjects Enrolled',  color: 'bg-teal-100 text-teal-700' },
  enrolled:          { label: 'Enrolled',           color: 'bg-emerald-100 text-emerald-700' },
  rejected:          { label: 'Rejected',           color: 'bg-red-100 text-red-700' },
};

function AdminStatusBadge({ status }) {
  const c = ADMIN_STATUS_CFG[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.color}`}>{c.label}</span>;
}

// ── Enrollments View ──────────────────────────────────────────────────────────
const ENROLL_PAGE_SIZE = 10;

function EnrollmentsView() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [approvalModal, setApprovalModal] = useState(null); // { id, action: 'approve'|'reject' }
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const tok = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

  async function loadEnrollments() {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/admin/enrollments', { headers: tok() });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadEnrollments(); }, []);

  // Filter
  const filtered = enrollments.filter(e => {
    const matchSearch = !search ||
      `${e.firstName} ${e.familyName}`.toLowerCase().includes(search.toLowerCase()) ||
      (e.studentNumber || '').includes(search) ||
      (e.course || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchLevel = levelFilter === 'all' || e.educationLevel === levelFilter;
    return matchSearch && matchStatus && matchLevel;
  });

  const totalPages = Math.ceil(filtered.length / ENROLL_PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * ENROLL_PAGE_SIZE, page * ENROLL_PAGE_SIZE);

  async function handleApprove() {
    if (!approvalModal) return;
    setActionLoading(true);
    try {
      const endpoint = approvalModal.action === 'approve' ? 'approve' : 'reject';
      if (approvalModal.action === 'reject' && !comment.trim()) {
        toast.error('Rejection reason is required');
        setActionLoading(false);
        return;
      }
      const res = await fetch(`http://localhost:3000/api/admin/enrollments/${approvalModal.id}/${endpoint}`, {
        method: 'POST', headers: tok(), body: JSON.stringify({ comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(approvalModal.action === 'approve' ? 'Enrollment approved' : 'Enrollment rejected');
      setApprovalModal(null);
      setComment('');
      loadEnrollments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBulkApprove() {
    const ids = selected.size > 0 ? Array.from(selected) : null;
    const count = ids ? ids.length : counts.verified;
    if (count === 0) { toast.error('No verified enrollments to approve'); return; }
    if (!confirm(`Approve ${count} verified enrollment(s)?`)) return;
    setBulkLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/admin/enrollments/bulk-approve', {
        method: 'POST', headers: tok(), body: JSON.stringify(ids ? { ids } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(data.message);
      setSelected(new Set());
      loadEnrollments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBulkLoading(false);
    }
  }

  // toggle selection helpers
  const verifiedOnPage = paginated.filter(e => e.status === 'verified');
  const allPageVerifiedSelected = verifiedOnPage.length > 0 && verifiedOnPage.every(e => selected.has(e.id));

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAllVerified() {
    if (allPageVerifiedSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        verifiedOnPage.forEach(e => next.delete(e.id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        verifiedOnPage.forEach(e => next.add(e.id));
        return next;
      });
    }
  }

  // Stats
  const counts = {
    total: enrollments.length,
    verified: enrollments.filter(e => e.status === 'verified').length,
    submitted: enrollments.filter(e => e.status === 'submitted').length,
    approved: enrollments.filter(e => e.status === 'approved').length,
    rejected: enrollments.filter(e => e.status === 'rejected').length,
  };

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: counts.total, color: 'bg-[#001840] text-white' },
          { label: 'Needs Approval', value: counts.verified, color: 'bg-purple-600 text-white' },
          { label: 'Submitted', value: counts.submitted, color: 'bg-blue-600 text-white' },
          { label: 'Approved', value: counts.approved, color: 'bg-green-600 text-white' },
          { label: 'Rejected', value: counts.rejected, color: 'bg-red-600 text-white' },
        ].map(c => (
          <div key={c.label} className={`${c.color} rounded-xl p-4`}>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs opacity-80 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, student #, course..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 focus:border-[#001840]" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 appearance-none bg-white">
          <option value="all">All Statuses</option>
          {Object.entries(ADMIN_STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 appearance-none bg-white">
          <option value="all">All Levels</option>
          <option value="JHS">JHS</option>
          <option value="SHS">SHS</option>
          <option value="College">College</option>
        </select>
        <button onClick={loadEnrollments} className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors text-gray-600">
          Refresh
        </button>
        {counts.verified > 0 && (
          <button
            onClick={handleBulkApprove}
            disabled={bulkLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            <CheckCircle size={14} />
            {bulkLoading
              ? 'Approving...'
              : selected.size > 0
                ? `Approve Selected (${selected.size})`
                : `Approve All Verified (${counts.verified})`}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#001840] rounded-full animate-spin" />
            Loading enrollments...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText size={36} className="mb-3 opacity-40" />
            <p className="text-sm">No enrollments found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50">
                    <th className="px-3 py-3 w-8">
                      <input type="checkbox"
                        checked={allPageVerifiedSelected}
                        onChange={toggleSelectAllVerified}
                        title="Select all verified on this page"
                        className="w-4 h-4 rounded border-gray-300 accent-[#001840]" />
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Student</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Level / Course</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(e => (
                    <tr key={e.id} className={`hover:bg-gray-50/50 transition-colors ${selected.has(e.id) ? 'bg-green-50/40' : ''}`}>
                      <td className="px-3 py-3">
                        {e.status === 'verified' && (
                          <input type="checkbox"
                            checked={selected.has(e.id)}
                            onChange={() => toggleSelect(e.id)}
                            className="w-4 h-4 rounded border-gray-300 accent-[#001840]" />
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">{e.firstName} {e.familyName}</p>
                        <p className="text-xs text-gray-400">{e.studentNumber || `#${e.id}`}</p>
                        {e.sscApplied == 1 && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">SSC Applicant</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-gray-700">
                          {e.educationLevel === 'College' ? e.course : `${e.educationLevel} Grade ${e.gradeLevel}`}
                        </p>
                        {(e.major || e.strand) && <p className="text-xs text-gray-400">{e.major || e.strand}</p>}
                      </td>
                      <td className="px-5 py-3">
                        {e.enrollmentType ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            e.enrollmentType === 'first-time' ? 'bg-blue-100 text-blue-700' :
                            e.enrollmentType === 'continuing' ? 'bg-green-100 text-green-700' :
                            e.enrollmentType === 'returnee' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>{e.enrollmentType}</span>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-3"><AdminStatusBadge status={e.status} /></td>
                      <td className="px-5 py-3 text-xs text-gray-400">
                        {e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/enrollment/${e.id}`, { state: { fromAdmin: true } })}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                            <Eye size={14} />
                          </button>
                          {/* Admin can only approve/reject VERIFIED enrollments */}
                          {e.status === 'verified' && (
                            <>
                              <button onClick={() => { setApprovalModal({ id: e.id, action: 'approve' }); setComment(''); }}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve">
                                <CheckCircle size={14} />
                              </button>
                              <button onClick={() => { setApprovalModal({ id: e.id, action: 'reject' }); setComment(''); }}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 bg-gray-50/30">
                <p className="text-xs text-gray-400">
                  Showing {(page - 1) * ENROLL_PAGE_SIZE + 1}–{Math.min(page * ENROLL_PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 transition-colors">
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 text-xs rounded-lg transition-colors ${p === page ? 'bg-[#001840] text-white font-semibold' : 'border border-gray-200 hover:bg-white text-gray-600'}`}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-1.5 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 transition-colors">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Notice about workflow */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
        <span className="font-semibold">Workflow:</span> Registrar verifies documents first → enrollment becomes <span className="font-semibold">Verified</span> → Admin approves or rejects here.
      </div>

      {/* Approve/Reject Modal */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setApprovalModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10">
            <div className={`px-6 py-4 border-b rounded-t-2xl ${approvalModal.action === 'approve' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <h3 className="font-semibold text-gray-900">
                {approvalModal.action === 'approve' ? '✅ Approve Enrollment' : '❌ Reject Enrollment'}
              </h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {approvalModal.action === 'approve' ? 'Comment (optional)' : 'Reason for rejection *'}
                </label>
                <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                  placeholder={approvalModal.action === 'approve' ? 'Add a note...' : 'Explain why this enrollment is being rejected...'}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setApprovalModal(null)} disabled={actionLoading}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleApprove} disabled={actionLoading}
                  className={`flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${approvalModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  {actionLoading ? 'Processing...' : approvalModal.action === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardView({ stats }) {
  const statCards = [
    {
      label: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      label: "Active FAQs",
      value: stats?.totalFAQs || 0,
      icon: MessageSquare,
      color: "bg-green-500",
    },
    {
      label: "Buildings",
      value: stats?.totalBuildings || 0,
      icon: Building2,
      color: "bg-purple-500",
    },
    {
      label: "Total Chats",
      value: stats?.totalChats || 0,
      icon: BarChart3,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button className="bg-[#001840] hover:bg-[#102A71]">
              <Plus className="w-4 h-4 mr-2" />
              Add FAQ
            </Button>
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              View Users
            </Button>
            <Button variant="outline">
              <Building2 className="w-4 h-4 mr-2" />
              Manage Buildings
            </Button>
            <Button variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Database Connection</span>
              </div>
              <Badge className="bg-green-600">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">API Services</span>
              </div>
              <Badge className="bg-green-600">Running</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Chat Bot</span>
              </div>
              <Badge className="bg-green-600">Online</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FAQsView({ faqs, onDelete, onEdit, onAdd, editingFAQ, showForm, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "Requirements",
    keywords: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    if (editingFAQ) {
      setFormData({
        question: editingFAQ.question,
        answer: editingFAQ.answer,
        category: editingFAQ.category,
        keywords: JSON.parse(editingFAQ.keywords || '[]').join(', ')
      });
    } else {
      setFormData({ question: "", answer: "", category: "Requirements", keywords: "" });
    }
  }, [editingFAQ]);

  // Filter FAQs based on search query
  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredFAQs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFAQs = filteredFAQs.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  function handleSubmit(e) {
    e.preventDefault();
    const data = {
      ...formData,
      keywords: JSON.stringify(formData.keywords.split(',').map(k => k.trim()).filter(k => k))
    };
    
    if (editingFAQ) {
      onSave(editingFAQ.id, data);
    } else {
      onSave(data);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">FAQ Management</h3>
          <p className="text-gray-600">Manage chatbot responses and knowledge base</p>
        </div>
        <Button onClick={onAdd} className="bg-[#001840] hover:bg-[#102A71]">
          <Plus className="w-4 h-4 mr-2" />
          Add New FAQ
        </Button>
      </div>

      {/* Search Bar */}
      {!showForm && !editingFAQ && (
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search FAQs by question, answer, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <div className="text-sm text-gray-600 whitespace-nowrap">
            {filteredFAQs.length} of {faqs.length} FAQs
          </div>
        </div>
      )}

      {(showForm || editingFAQ) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingFAQ ? "Edit FAQ" : "Create New FAQ"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                <Input
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="What are the admission requirements?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Answer</label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Provide a detailed answer..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5C400] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5C400] focus:border-transparent"
                >
                  <option>Requirements</option>
                  <option>Deadlines</option>
                  <option>Programs</option>
                  <option>Enrollment</option>
                  <option>Location</option>
                  <option>Fees</option>
                  <option>Financial Aid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords (comma-separated)
                </label>
                <Input
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="admission, requirements, documents"
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="bg-[#001840] hover:bg-[#102A71]">
                  {editingFAQ ? "Update FAQ" : "Create FAQ"}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {currentFAQs.length > 0 ? (
        <>
          <div className="grid gap-4">
            {currentFAQs.map((faq) => (
              <Card key={faq.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>{faq.category}</Badge>
                        <span className="text-xs text-gray-500">
                          {faq.views} views • {faq.helpful} helpful
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{faq.answer}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(faq)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit FAQ"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => onDelete(faq.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-6">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredFAQs.length)} of {filteredFAQs.length} FAQs
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            currentPage === page
                              ? "bg-[#001840] text-white"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "No FAQs found" : "No FAQs yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? "Try adjusting your search query"
                : "Get started by creating your first FAQ"}
            </p>
            {!searchQuery && (
              <Button onClick={onAdd} className="bg-[#001840] hover:bg-[#102A71]">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First FAQ
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function UsersView({ users }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const filtered = users.filter(u =>
    !search ||
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">User Management</h3>
          <p className="text-gray-600 text-sm mt-0.5">{users.length} registered users</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search users..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 focus:border-[#001840]" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginated.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm">No users found</td></tr>
                ) : paginated.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <Badge className={
                        user.role === 'admin' ? 'bg-purple-600' :
                        user.role === 'registrar' ? 'bg-blue-600' : 'bg-gray-600'
                      }>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge className={user.isActive !== false ? 'bg-green-600' : 'bg-red-600'}>
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/30">
              <p className="text-xs text-gray-400">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 transition-colors">
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 text-xs rounded-lg transition-colors ${p === page ? 'bg-[#001840] text-white font-semibold' : 'border border-gray-200 hover:bg-white text-gray-600'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Aerial Photo Pin Picker ───────────────────────────────────────────────────
function AerialPinPicker({ position, onPositionChange, onClose }) {
  const [localPos, setLocalPos] = useState(position || null);
  const imgRef = useRef(null);

  function handleImageClick(e) {
    e.stopPropagation();
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLocalPos({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
  }

  function handleConfirm(e) {
    e.stopPropagation();
    if (localPos) { onPositionChange(localPos); onClose(); }
  }

  function handleCancel(e) {
    e.stopPropagation();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70">
      {/* Modal — fixed height so buttons are always visible */}
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: '100%', maxWidth: '780px', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header — always visible */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0 bg-[#FFFDF0]">
          <div>
            <h3 className="font-bold text-[#001840] text-sm">Pin Building Location</h3>
            <p className="text-xs text-gray-400 mt-0.5">Click on the photo to place a pin · Click again to move it</p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Image area — scrollable if needed */}
        <div className="flex-1 overflow-auto relative cursor-crosshair select-none bg-gray-100">
          <div className="relative inline-block w-full" onClick={handleImageClick}>
            <img
              ref={imgRef}
              src="/emc_aerial.jpg"
              alt="EMC Campus"
              className="w-full h-auto block"
              draggable={false}
            />
            {/* Pin */}
            {localPos && (
              <div
                style={{ left: `${localPos.x}%`, top: `${localPos.y}%`, position: 'absolute', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
              >
                <div className="w-9 h-9 bg-[#F5C400] border-2 border-white rounded-full shadow-xl flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-[#001840]" />
                </div>
                {/* Ripple */}
                <div className="absolute inset-0 rounded-full bg-[#F5C400] opacity-30 animate-ping" />
              </div>
            )}
          </div>
        </div>

        {/* Footer — always visible */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-white flex-shrink-0">
          <p className="text-xs text-gray-500">
            {localPos
              ? <span className="text-green-600 font-medium">✅ Pin placed — x: {localPos.x}%, y: {localPos.y}%</span>
              : <span className="text-gray-400">Click anywhere on the photo to place a pin</span>}
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!localPos}
              className="px-4 py-2 bg-[#001840] text-white rounded-lg text-sm font-medium hover:bg-[#102A71] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              <Target className="w-4 h-4" /> Confirm Pin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BuildingsView({ buildings, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [formData, setFormData] = useState({
    name: "", shortName: "", category: "Academic",
    description: "", offices: "", hours: "",
    pinX: "50", pinY: "50", imageUrl: "", color: "#102A71"
  });

  useEffect(() => {
    if (editingBuilding) {
      const coords = JSON.parse(editingBuilding.coordinates || '{"x":50,"y":50}');
      setFormData({
        name: editingBuilding.name || "",
        shortName: editingBuilding.shortName || "",
        category: editingBuilding.category || "Academic",
        description: editingBuilding.description || "",
        offices: Array.isArray(editingBuilding.offices)
          ? editingBuilding.offices.join(", ")
          : JSON.parse(editingBuilding.offices || '[]').join(", "),
        hours: editingBuilding.hours || "",
        pinX: String(coords.x ?? coords.pinX ?? 50),
        pinY: String(coords.y ?? coords.pinY ?? 50),
        imageUrl: editingBuilding.imageUrl || "",
        color: editingBuilding.color || "#102A71"
      });
      setPreviewUrl(editingBuilding.imageUrl ? `http://localhost:3000${editingBuilding.imageUrl}` : null);
      setSelectedFile(null);
    } else {
      setFormData({
        name: "", shortName: "", category: "Academic",
        description: "", offices: "", hours: "",
        pinX: "50", pinY: "50", imageUrl: "", color: "#102A71"
      });
      setPreviewUrl(null);
      setSelectedFile(null);
    }
  }, [editingBuilding]);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    // Use FormData for file upload
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("shortName", formData.shortName);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("offices", JSON.stringify(formData.offices.split(',').map(o => o.trim()).filter(o => o)));
    formDataToSend.append("hours", formData.hours);
    formDataToSend.append("coordinates", JSON.stringify({ 
      x: parseFloat(formData.pinX), 
      y: parseFloat(formData.pinY) 
    }));
    formDataToSend.append("color", formData.color);
    
    // Add file if selected
    if (selectedFile) {
      formDataToSend.append("photo360", selectedFile);
    } else if (formData.imageUrl) {
      // Keep existing URL if no new file
      formDataToSend.append("imageUrl", formData.imageUrl);
    }

    try {
      const url = editingBuilding 
        ? `http://localhost:3000/api/admin/buildings/${editingBuilding.id}`
        : "http://localhost:3000/api/admin/buildings";
      
      const response = await fetch(url, {
        method: editingBuilding ? "PUT" : "POST",
        headers: {
          "Authorization": `Bearer ${token}`
          // Don't set Content-Type, let browser set it with boundary for FormData
        },
        body: formDataToSend
      });

      if (response.ok) {
        setShowForm(false);
        setEditingBuilding(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error("Error saving building:", error);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this building?")) return;
    
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:3000/api/admin/buildings/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok && onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting building:", error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Building Management</h3>
          <p className="text-gray-600">Manage campus buildings, locations, and 360° photos</p>
        </div>
        <Button 
          onClick={() => {
            setShowForm(true);
            setEditingBuilding(null);
          }} 
          className="bg-[#001840] hover:bg-[#102A71]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Building
        </Button>
      </div>

      {/* Building Form */}
      {(showForm || editingBuilding) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingBuilding ? "Edit Building" : "Add New Building"}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Aerial Pin Picker Modal */}
            {showMapPicker && (
              <AerialPinPicker
                position={formData.pinX ? { x: parseFloat(formData.pinX), y: parseFloat(formData.pinY) } : null}
                onPositionChange={(pos) => {
                  setFormData({ ...formData, pinX: pos.x.toString(), pinY: pos.y.toString() });
                }}
                onClose={() => setShowMapPicker(false)}
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Administration Building"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Short Name</label>
                  <Input
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    placeholder="Admin Hall"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the building..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5C400] focus:border-transparent"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5C400] focus:border-transparent"
                  >
                    <option>Administration</option>
                    <option>Academic</option>
                    <option>Services</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color (Hex)</label>
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offices/Rooms (comma-separated)
                </label>
                <Input
                  value={formData.offices}
                  onChange={(e) => setFormData({ ...formData, offices: e.target.value })}
                  placeholder="Registrar's Office, Cashier, Guidance Office"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Operating Hours</label>
                <Input
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  placeholder="Mon-Fri: 8:00 AM - 5:00 PM"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Building Location on Campus Map
                </label>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="w-full px-4 py-3 bg-[#001840] hover:bg-[#102A71] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-5 h-5" />
                    {formData.pinX ? 'Reposition Pin on Aerial Photo' : 'Click to Pin Location on Aerial Photo'}
                  </button>
                  <div className="bg-[#FFFDF0] border border-[#F5C400]/30 rounded-lg p-3">
                    {formData.pinX && formData.pinY ? (
                      <p className="text-xs text-gray-600">
                        ✅ Pin placed at <span className="font-mono font-semibold text-[#001840]">x: {formData.pinX}%, y: {formData.pinY}%</span>
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">No pin placed yet — click the button above to set location on the aerial photo</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  360° Panoramic Photo
                </label>
                
                {/* File Upload */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[#F5C400] transition-colors text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="flex flex-col items-center gap-2">
                          <Plus className="w-8 h-8 text-gray-400" />
                          <p className="text-sm font-medium text-gray-700">
                            {selectedFile ? selectedFile.name : "Click to upload 360° photo"}
                          </p>
                          <p className="text-xs text-gray-500">
                            JPG, PNG up to 50MB
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Preview */}
                  {previewUrl && (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                          setFormData({ ...formData, imageUrl: "" });
                        }}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Upload an equirectangular 360° panoramic photo for interactive viewing
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="bg-[#001840] hover:bg-[#102A71]">
                  {editingBuilding ? "Update Building" : "Create Building"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingBuilding(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Buildings Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {buildings.map((building) => (
          <Card key={building.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: building.color || "#001840" }}
                  >
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{building.shortName}</h4>
                    <Badge className="mt-1">{building.category}</Badge>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{building.description}</p>
              {building.imageUrl && (
                <div className="mb-3 text-xs text-green-600 flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  360° Photo Available
                </div>
              )}
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditingBuilding(building);
                    setShowForm(false);
                  }}
                  className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  <Edit className="w-4 h-4 inline mr-1" />
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(building.id)}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900">Settings</h3>
        <p className="text-gray-600">Configure system settings and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
          <CardDescription>Manage system-wide settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Chatbot Auto-Response</p>
              <p className="text-sm text-gray-600">Enable automatic responses for common questions</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-600">Send email alerts for new user registrations</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Maintenance Mode</p>
              <p className="text-sm text-gray-600">Temporarily disable public access</p>
            </div>
            <input type="checkbox" className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
