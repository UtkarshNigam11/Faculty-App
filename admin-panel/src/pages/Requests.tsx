import { useState, useEffect, useMemo } from 'react'
import { Search, Trash2, X, Check, Calendar, Clock, MapPin, BookOpen, FileText, Phone, Mail, Building, ChevronDown, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { getRequests, deleteRequest, type SubstituteRequest, type Admin } from '../services/api'

interface RequestsProps {
  admin: Admin
}

type DateFilter = 'all' | 'today' | 'tomorrow' | 'this_week' | 'upcoming' | 'past'

const ITEMS_PER_PAGE = 20

export default function Requests({ admin }: RequestsProps) {
  const isSuperAdmin = admin.role === 'super_admin'
  const [requests, setRequests] = useState<SubstituteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<SubstituteRequest | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchRequests()
  }, [])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, typeFilter, dateFilter])

  const fetchRequests = async () => {
    try {
      const data = await getRequests()
      setRequests(data)
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRequest = async (id: number) => {
    try {
      await deleteRequest(id)
      setRequests(requests.filter(r => r.id !== id))
      setDeleteConfirm(null)
      setSelectedRequest(null)
    } catch (error) {
      console.error('Error deleting request:', error)
      alert('Failed to delete request')
    }
  }

  // Date helpers
  const getDateOnly = (dateStr: string) => {
    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)
    return date
  }

  const getTodayDate = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }

  const isToday = (dateStr: string) => {
    return getDateOnly(dateStr).getTime() === getTodayDate().getTime()
  }

  const isTomorrow = (dateStr: string) => {
    const tomorrow = new Date(getTodayDate())
    tomorrow.setDate(tomorrow.getDate() + 1)
    return getDateOnly(dateStr).getTime() === tomorrow.getTime()
  }

  const isThisWeek = (dateStr: string) => {
    const today = getTodayDate()
    const date = getDateOnly(dateStr)
    const weekEnd = new Date(today)
    weekEnd.setDate(today.getDate() + 7)
    return date >= today && date <= weekEnd
  }

  const isUpcoming = (dateStr: string) => {
    return getDateOnly(dateStr) >= getTodayDate()
  }

  const isPast = (dateStr: string) => {
    return getDateOnly(dateStr) < getTodayDate()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Sort by date (newest first, past at bottom)
  const sortRequests = (a: SubstituteRequest, b: SubstituteRequest) => {
    return getDateOnly(b.date).getTime() - getDateOnly(a.date).getTime()
  }

  // Memoized counts for performance
  const counts = useMemo(() => ({
    total: requests.length,
    class: requests.filter(r => r.request_type === 'class').length,
    exam: requests.filter(r => r.request_type === 'exam').length,
    today: requests.filter(r => isToday(r.date)).length,
    pending: requests.filter(r => r.status === 'pending').length,
  }), [requests])

  // Memoized filtered and sorted requests
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const subject = request.subject || ''
      const teacherName = request.teacher_name || ''
      const matchesSearch = 
        subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacherName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter
      const matchesType = typeFilter === 'all' || request.request_type === typeFilter
      
      let matchesDate = true
      if (dateFilter === 'today') matchesDate = isToday(request.date)
      else if (dateFilter === 'tomorrow') matchesDate = isTomorrow(request.date)
      else if (dateFilter === 'this_week') matchesDate = isThisWeek(request.date)
      else if (dateFilter === 'upcoming') matchesDate = isUpcoming(request.date)
      else if (dateFilter === 'past') matchesDate = isPast(request.date)
      
      return matchesSearch && matchesStatus && matchesType && matchesDate
    }).sort(sortRequests)
  }, [requests, searchTerm, statusFilter, typeFilter, dateFilter])

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE)
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredRequests, currentPage])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'accepted': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const formatLocation = (request: SubstituteRequest) => {
    if (request.request_type === 'exam') {
      return request.campus || 'Campus TBD'
    }
    const parts = []
    if (request.classroom) parts.push(request.classroom)
    if (request.campus) parts.push(request.campus)
    return parts.length > 0 ? parts.join(', ') : 'Location TBD'
  }

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500'
      case 'accepted': return 'bg-emerald-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requests</h1>
          <p className="text-sm text-gray-500">{counts.total} total • Showing {paginatedRequests.length} of {filteredRequests.length} filtered</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => { setTypeFilter('all'); setStatusFilter('all'); setDateFilter('all'); }}
          className={`p-3 rounded-lg text-left transition ${
            typeFilter === 'all' && statusFilter === 'all' && dateFilter === 'all'
              ? 'bg-primary-50 border-2 border-primary-500 shadow-sm' 
              : 'bg-white border border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-xl font-bold text-gray-900">{counts.total}</p>
          <p className="text-xs text-gray-500">All</p>
        </button>
        <button
          onClick={() => { setDateFilter('today'); setTypeFilter('all'); setStatusFilter('all'); }}
          className={`p-3 rounded-lg text-left transition ${
            dateFilter === 'today' ? 'bg-blue-50 border-2 border-blue-500 shadow-sm' : 'bg-white border border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-xl font-bold text-blue-600">{counts.today}</p>
          <p className="text-xs text-gray-500">Today</p>
        </button>
        <button
          onClick={() => { setTypeFilter('class'); setDateFilter('all'); setStatusFilter('all'); }}
          className={`p-3 rounded-lg text-left transition ${
            typeFilter === 'class' ? 'bg-indigo-50 border-2 border-indigo-500 shadow-sm' : 'bg-white border border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <BookOpen size={14} className="text-indigo-600" />
            <p className="text-xl font-bold text-gray-900">{counts.class}</p>
          </div>
          <p className="text-xs text-gray-500">Class</p>
        </button>
        <button
          onClick={() => { setTypeFilter('exam'); setDateFilter('all'); setStatusFilter('all'); }}
          className={`p-3 rounded-lg text-left transition ${
            typeFilter === 'exam' ? 'bg-purple-50 border-2 border-purple-500 shadow-sm' : 'bg-white border border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <FileText size={14} className="text-purple-600" />
            <p className="text-xl font-bold text-gray-900">{counts.exam}</p>
          </div>
          <p className="text-xs text-gray-500">Exam</p>
        </button>
        <button
          onClick={() => { setStatusFilter('pending'); setTypeFilter('all'); setDateFilter('all'); }}
          className={`p-3 rounded-lg text-left transition ${
            statusFilter === 'pending' ? 'bg-amber-50 border-2 border-amber-500 shadow-sm' : 'bg-white border border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-xl font-bold text-amber-600">{counts.pending}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by subject or teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none appearance-none bg-white cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none appearance-none bg-white cursor-pointer"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="this_week">This Week</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
          <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">Request</div>
          <div className="col-span-2">Date & Time</div>
          <div className="col-span-2">Location</div>
          <div className="col-span-2">Requested By</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100">
          {paginatedRequests.map((request) => (
              <div 
                key={request.id} 
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 hover:bg-gray-50 transition cursor-pointer items-center"
                onClick={() => setSelectedRequest(request)}
              >
                {/* Request Info */}
                <div className="col-span-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusDot(request.status)}`}></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate text-sm">
                        {request.request_type === 'exam' ? 'Exam Duty' : (request.subject || 'Class')}
                      </p>
                      <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        request.request_type === 'exam' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {request.request_type === 'exam' ? 'Exam' : 'Class'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate md:hidden">{request.teacher_name}</p>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="col-span-2 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900">{formatDate(request.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-0.5">
                    <Clock size={12} className="text-gray-400 flex-shrink-0" />
                    {request.time}
                  </div>
                </div>

                {/* Location */}
                <div className="col-span-2 hidden md:flex items-center gap-1.5 text-sm text-gray-600">
                  <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="truncate">{formatLocation(request)}</span>
                </div>

                {/* Requested By */}
                <div className="col-span-2 hidden md:block">
                  <p className="text-sm font-medium text-gray-900 truncate">{request.teacher_name || 'Unknown'}</p>
                  {request.acceptor_name && (
                    <p className="text-xs text-emerald-600 truncate">→ {request.acceptor_name}</p>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-2 hidden md:block">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex justify-end" onClick={(e) => e.stopPropagation()}>
                  {isSuperAdmin && (
                    deleteConfirm === request.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteRequest(request.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                          title="Confirm delete"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(request.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete request"
                      >
                        <Trash2 size={16} />
                      </button>
                    )
                  )}
                </div>
              </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredRequests.length === 0 && (
          <div className="px-4 py-12 text-center text-gray-500">
            <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="font-medium">No requests found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
            <p className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedRequest(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusDot(selectedRequest.status)}`}></div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedRequest.request_type === 'exam' ? 'Exam Duty' : (selectedRequest.subject || 'Class')}
                  </h2>
                  <p className="text-xs text-gray-500">Request #{selectedRequest.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Type & Status */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  selectedRequest.request_type === 'exam' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {selectedRequest.request_type === 'exam' ? 'Exam Duty' : 'Class'}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedRequest.status)}`}>
                  {selectedRequest.status}
                </span>
                {isPast(selectedRequest.date) && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                    Past
                  </span>
                )}
              </div>

              {/* Date & Time & Location */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={16} className="text-primary-600 flex-shrink-0" />
                  <span className={`font-medium ${isToday(selectedRequest.date) ? 'text-blue-600' : ''}`}>
                    {formatDate(selectedRequest.date)}
                  </span>
                  <span className="text-gray-400">({selectedRequest.date})</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={16} className="text-primary-600 flex-shrink-0" />
                  <span className="font-medium">{selectedRequest.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-primary-600 flex-shrink-0" />
                  <span>{formatLocation(selectedRequest)}</span>
                </div>
                {selectedRequest.request_type === 'class' && (selectedRequest.classroom || selectedRequest.campus) && (
                  <div className="text-xs text-gray-500 ml-6 space-x-2">
                    {selectedRequest.classroom && <span>Room: {selectedRequest.classroom}</span>}
                    {selectedRequest.classroom && selectedRequest.campus && <span>•</span>}
                    {selectedRequest.campus && <span>Campus: {selectedRequest.campus}</span>}
                  </div>
                )}
              </div>

              {/* Requested By */}
              <div className="border rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Requested By</p>
                <p className="font-semibold text-gray-900">{selectedRequest.teacher_name || 'Unknown'}</p>
                <div className="mt-2 space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-gray-400" />
                    <span>{selectedRequest.teacher_email || 'Email not available'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-gray-400" />
                    <span>{selectedRequest.teacher_phone || 'Phone not available'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building size={12} className="text-gray-400" />
                    <span>{selectedRequest.teacher_department || 'Department not available'}</span>
                  </div>
                </div>
              </div>

              {/* Accepted By */}
              {selectedRequest.acceptor_name && (
                <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-2">Accepted By</p>
                  <p className="font-semibold text-emerald-800">{selectedRequest.acceptor_name}</p>
                  <div className="mt-2 space-y-1.5 text-xs text-emerald-700">
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-emerald-500" />
                      <span>{selectedRequest.acceptor_email || 'Email not available'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-emerald-500" />
                      <span>{selectedRequest.acceptor_phone || 'Phone not available'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building size={12} className="text-emerald-500" />
                      <span>{selectedRequest.acceptor_department || 'Department not available'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedRequest.notes && (
                <div className="border rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{selectedRequest.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-2 p-4 border-t bg-gray-50 rounded-b-2xl flex-shrink-0">
              <button
                onClick={() => setSelectedRequest(null)}
                className="flex-1 px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                Close
              </button>
              {isSuperAdmin && (
                <button
                  onClick={() => { setDeleteConfirm(selectedRequest.id); }}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
