import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, FileText, Clock, CheckCircle, Activity, Bell, Send, RefreshCw, Mail } from 'lucide-react'
import { getRequests, getUsers, getPendingInvites, type SubstituteRequest, type User, type PendingInvite } from '../services/api'

export default function Dashboard() {
  const [recentRequests, setRecentRequests] = useState<SubstituteRequest[]>([])
  const [recentInvites, setRecentInvites] = useState<PendingInvite[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [allRequests, setAllRequests] = useState<SubstituteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setRefreshing(true)
    try {
      const [usersData, requestsData, invitesData] = await Promise.all([
        getUsers(),
        getRequests(),
        getPendingInvites(),
      ])
      setUsers(usersData)
      setAllRequests(requestsData)
      setRecentRequests(requestsData.slice(0, 5))
      setRecentInvites(invitesData.slice(0, 6))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const todayISO = new Date().toISOString().slice(0, 10)
  const tomorrowISO = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const counts = useMemo(() => {
    const totalUsers = users.length
    const usersWithTokens = users.filter(u => !!u.push_token).length
    const tokenCoverage = totalUsers > 0 ? Math.round((usersWithTokens / totalUsers) * 100) : 0

    const totalRequests = allRequests.length
    const pendingRequests = allRequests.filter(r => r.status === 'pending').length
    const acceptedRequests = allRequests.filter(r => r.status === 'accepted').length
    const cancelledRequests = allRequests.filter(r => r.status === 'cancelled').length

    const classRequests = allRequests.filter(r => r.request_type === 'class').length
    const examRequests = allRequests.filter(r => r.request_type === 'exam').length

    const requestsToday = allRequests.filter(r => r.date === todayISO).length
    const requestsTomorrow = allRequests.filter(r => r.date === tomorrowISO).length

    return {
      totalUsers,
      usersWithTokens,
      tokenCoverage,
      totalRequests,
      pendingRequests,
      acceptedRequests,
      cancelledRequests,
      classRequests,
      examRequests,
      requestsToday,
      requestsTomorrow,
      invitesPending: recentInvites.filter(i => i.status === 'pending').length,
      invitesAccepted: recentInvites.filter(i => i.status === 'accepted').length,
      invitesExpired: recentInvites.filter(i => i.status === 'expired').length,
    }
  }, [users, allRequests, todayISO, tomorrowISO, recentInvites])

  const statCards = [
    {
      label: 'Total Users',
      value: counts.totalUsers,
      icon: Users,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      label: 'Push Token Coverage',
      value: `${counts.tokenCoverage}%`,
      sub: `${counts.usersWithTokens}/${counts.totalUsers} enabled`,
      icon: Bell,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700'
    },
    {
      label: 'Total Requests',
      value: counts.totalRequests,
      icon: FileText,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      label: 'Pending Requests',
      value: counts.pendingRequests,
      icon: Clock,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      label: 'Accepted Requests',
      value: counts.acceptedRequests,
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      label: 'Pending Invites',
      value: counts.invitesPending,
      icon: Mail,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700'
    },
  ] as const

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Quick overview of users, requests, and invites</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link
            to="/notifications"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Send size={16} />
            Send Notification
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                {'sub' in stat && stat.sub ? (
                  <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>
                ) : null}
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <stat.icon className={stat.textColor} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Breakdown</h2>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Requests</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Class</p>
                  <p className="text-xl font-bold text-gray-900">{counts.classRequests}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Exam</p>
                  <p className="text-xl font-bold text-gray-900">{counts.examRequests}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Cancelled</p>
                  <p className="text-xl font-bold text-gray-900">{counts.cancelledRequests}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Accepted</p>
                  <p className="text-xl font-bold text-gray-900">{counts.acceptedRequests}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Today / Tomorrow</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Today</span>
                  <span className="font-semibold">{counts.requestsToday}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tomorrow</span>
                  <span className="font-semibold">{counts.requestsTomorrow}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Invites</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-amber-700">Pending</p>
                  <p className="text-xl font-bold text-amber-900">{counts.invitesPending}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-700">Accepted</p>
                  <p className="text-xl font-bold text-green-900">{counts.invitesAccepted}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">Expired</p>
                  <p className="text-xl font-bold text-gray-900">{counts.invitesExpired}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Link to="/requests" className="flex-1 text-center px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-sm font-medium">
                View Requests
              </Link>
              <Link to="/users" className="flex-1 text-center px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-sm font-medium">
                Manage Users
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Requests</h2>
            </div>
          </div>
          <div className="p-6">
            {recentRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No requests yet</p>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${request.request_type === 'class' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                          {request.request_type}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(request.date)} • {request.time}</span>
                      </div>
                      <p className="font-medium text-gray-900 truncate">{request.subject || '(No subject)'}</p>
                      <p className="text-sm text-gray-500 truncate">{request.teacher_name || 'Unknown teacher'}</p>
                    </div>
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-medium flex-shrink-0
                      ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                      ${request.status === 'accepted' ? 'bg-green-100 text-green-700' : ''}
                      ${request.status === 'cancelled' ? 'bg-red-100 text-red-700' : ''}
                    `}>
                      {request.status}
                    </span>
                  </div>
                ))}
                <div className="pt-2">
                  <Link to="/requests" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View all requests →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Invites */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail size={20} className="text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Invites</h2>
          </div>
          <Link to="/users" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Manage invites →
          </Link>
        </div>
        <div className="p-6">
          {recentInvites.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No invites yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentInvites.map(inv => (
                <div key={inv.id} className="border border-gray-100 rounded-xl p-4">
                  <p className="font-medium text-gray-900 truncate">{inv.name}</p>
                  <p className="text-sm text-gray-500 truncate">{inv.email}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      inv.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      inv.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {inv.status}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(inv.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
