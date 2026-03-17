import { useState, useEffect } from 'react'
import { Search, Trash2, Edit2, X, Check, UserPlus, Mail, Upload, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react'
import { 
  getUsers, updateUser, deleteUser, 
  inviteUser, bulkInviteUsers, getPendingInvites, cancelInvite, resendInvite,
  type User, type Admin, type PendingInvite, type InviteUserRequest 
} from '../services/api'

interface UsersProps {
  admin: Admin
}

export default function Users({ admin }: UsersProps) {
  const isSuperAdmin = admin.role === 'super_admin'
  const [users, setUsers] = useState<User[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'users' | 'invites'>('users')
  
  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteMode, setInviteMode] = useState<'single' | 'bulk'>('single')
  const [newInvite, setNewInvite] = useState({
    name: '',
    email: '',
    department: '',
    phone: ''
  })
  const [csvData, setCsvData] = useState<InviteUserRequest[]>([])
  const [inviteError, setInviteError] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersData, invitesData] = await Promise.all([
        getUsers(),
        getPendingInvites()
      ])
      setUsers(usersData)
      setPendingInvites(invitesData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      await updateUser(editingUser.id, {
        name: editingUser.name,
        department: editingUser.department,
        phone: editingUser.phone,
      })
      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u))
      setEditingUser(null)
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Failed to update user')
    }
  }

  const handleInviteUser = async () => {
    setInviteError('')
    setInviteSuccess('')
    
    if (!newInvite.name || !newInvite.email) {
      setInviteError('Name and email are required')
      return
    }

    const emailToUse = newInvite.email.includes('@') 
      ? newInvite.email.toLowerCase() 
      : `${newInvite.email.toLowerCase()}@kiit.ac.in`

    setInviting(true)
    try {
      const result = await inviteUser({
        name: newInvite.name,
        email: emailToUse,
        department: newInvite.department || undefined,
        phone: newInvite.phone || undefined
      })
      
      if (result.success) {
        setInviteSuccess(`Invite sent to ${emailToUse}`)
        setNewInvite({ name: '', email: '', department: '', phone: '' })
        // Refresh invites list
        const invites = await getPendingInvites()
        setPendingInvites(invites)
        // Switch to invites tab
        setActiveTab('invites')
        setTimeout(() => {
          setShowInviteModal(false)
          setInviteSuccess('')
        }, 2000)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invite'
      setInviteError(errorMessage)
    } finally {
      setInviting(false)
    }
  }

  const handleBulkInvite = async () => {
    setInviteError('')
    setInviteSuccess('')
    
    if (csvData.length === 0) {
      setInviteError('No valid users found in CSV')
      return
    }

    setInviting(true)
    try {
      const result = await bulkInviteUsers(csvData)
      
      if (result.sent > 0) {
        setInviteSuccess(`Successfully sent ${result.sent} of ${result.total} invites`)
        if (result.errors.length > 0) {
          setInviteError(`Errors: ${result.errors.slice(0, 3).join('; ')}${result.errors.length > 3 ? '...' : ''}`)
        }
        setCsvData([])
        // Refresh invites list
        const invites = await getPendingInvites()
        setPendingInvites(invites)
        setActiveTab('invites')
      } else {
        setInviteError(`Failed to send invites: ${result.errors.join('; ')}`)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invites'
      setInviteError(errorMessage)
    } finally {
      setInviting(false)
    }
  }

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      // Skip header row if present
      const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0
      
      const parsedData: InviteUserRequest[] = []
      
      for (let i = startIndex; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        
        if (values.length >= 2 && values[0] && values[1]) {
          const email = values[1].includes('@') ? values[1].toLowerCase() : `${values[1].toLowerCase()}@kiit.ac.in`
          parsedData.push({
            name: values[0],
            email: email,
            phone: values[2] || undefined,
            department: values[3] || undefined
          })
        }
      }
      
      setCsvData(parsedData)
      setInviteError('')
    }
    reader.readAsText(file)
  }

  const handleDeleteUser = async (id: number) => {
    try {
      await deleteUser(id)
      setUsers(users.filter(u => u.id !== id))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }

  const handleCancelInvite = async (inviteId: number) => {
    try {
      await cancelInvite(inviteId)
      setPendingInvites(pendingInvites.filter(i => i.id !== inviteId))
    } catch (error) {
      console.error('Error canceling invite:', error)
      alert('Failed to cancel invite')
    }
  }

  const handleResendInvite = async (inviteId: number) => {
    try {
      await resendInvite(inviteId)
      alert('Invite resent successfully')
    } catch (error) {
      console.error('Error resending invite:', error)
      alert('Failed to resend invite')
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredInvites = pendingInvites.filter(invite =>
    invite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invite.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invite.department?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendingCount = pendingInvites.filter(i => i.status === 'pending').length

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500">
            {users.length} registered users • {pendingCount} pending invites
          </p>
        </div>
        <button 
          onClick={() => {
            setShowInviteModal(true)
            setInviteMode('single')
            setInviteError('')
            setInviteSuccess('')
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <UserPlus size={20} />
          Invite User
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'users'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Registered Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('invites')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'invites'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pending Invites ({pendingCount})
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder={activeTab === 'users' ? "Search users..." : "Search invites..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      </div>

      {/* Users Table */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.department || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{user.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`
                        px-3 py-1 rounded-full text-xs font-medium
                        ${user.email_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                      `}>
                        {user.email_verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        {isSuperAdmin && (
                          deleteConfirm === user.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              >
                                <Check size={18} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              No users found
            </div>
          )}
        </div>
      )}

      {/* Pending Invites Table */}
      {activeTab === 'invites' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invitee</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sent</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvites.map((invite) => (
                  <tr key={invite.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <Mail className="text-amber-600" size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{invite.name}</p>
                          <p className="text-sm text-gray-500">{invite.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{invite.department || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`
                        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                        ${invite.status === 'pending' ? 'bg-amber-100 text-amber-700' : ''}
                        ${invite.status === 'accepted' ? 'bg-green-100 text-green-700' : ''}
                        ${invite.status === 'expired' ? 'bg-gray-100 text-gray-500' : ''}
                      `}>
                        {invite.status === 'pending' && <Clock size={12} />}
                        {invite.status === 'accepted' && <CheckCircle size={12} />}
                        {invite.status === 'expired' && <XCircle size={12} />}
                        {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(invite.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {invite.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleResendInvite(invite.id)}
                              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                              title="Resend invite"
                            >
                              <RefreshCw size={18} />
                            </button>
                            <button
                              onClick={() => handleCancelInvite(invite.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Cancel invite"
                            >
                              <Trash2 size={18} />
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

          {filteredInvites.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              No pending invites
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={editingUser.department || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Invite Faculty</h2>
              <button
                onClick={() => {
                  setShowInviteModal(false)
                  setInviteError('')
                  setInviteSuccess('')
                  setCsvData([])
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setInviteMode('single')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  inviteMode === 'single'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Mail size={18} className="inline mr-2" />
                Single Invite
              </button>
              <button
                onClick={() => setInviteMode('bulk')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  inviteMode === 'bulk'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Upload size={18} className="inline mr-2" />
                Bulk CSV
              </button>
            </div>
            
            {inviteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {inviteError}
              </div>
            )}

            {inviteSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                {inviteSuccess}
              </div>
            )}

            {/* Single Invite Form */}
            {inviteMode === 'single' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newInvite.name}
                    onChange={(e) => setNewInvite({ ...newInvite, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={newInvite.email}
                      onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      placeholder="username"
                    />
                    <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-500 text-sm">
                      @kiit.ac.in
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email must end with @kiit.ac.in</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newInvite.department}
                    onChange={(e) => setNewInvite({ ...newInvite, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="e.g., CSE, ECE"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={newInvite.phone}
                    onChange={(e) => setNewInvite({ ...newInvite, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Phone number"
                  />
                </div>
                <button
                  onClick={handleInviteUser}
                  disabled={inviting}
                  className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {inviting ? 'Sending Invite...' : 'Send Invite'}
                </button>
              </div>
            )}

            {/* Bulk CSV Upload */}
            {inviteMode === 'bulk' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-2">Upload a CSV file with user details</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition"
                  >
                    Choose File
                  </label>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">CSV Format:</p>
                  <code className="text-xs text-gray-600 block bg-white p-2 rounded border">
                    Name,Email,Phone,Department<br />
                    John Doe,john.fcs@kiit.ac.in,9876543210,CSE<br />
                    Jane Smith,jane.fcs,9876543211,IT
                  </code>
                  <p className="text-xs text-gray-500 mt-2">
                    • Email can be full or just username (will add @kiit.ac.in)<br />
                    • Phone and Department are optional
                  </p>
                </div>

                {csvData.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Preview ({csvData.length} users):
                    </p>
                    <div className="max-h-48 overflow-y-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left">Name</th>
                            <th className="px-3 py-2 text-left">Email</th>
                            <th className="px-3 py-2 text-left">Dept</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {csvData.slice(0, 10).map((user, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2">{user.name}</td>
                              <td className="px-3 py-2 text-gray-500">{user.email}</td>
                              <td className="px-3 py-2 text-gray-500">{user.department || '-'}</td>
                            </tr>
                          ))}
                          {csvData.length > 10 && (
                            <tr>
                              <td colSpan={3} className="px-3 py-2 text-center text-gray-500">
                                ... and {csvData.length - 10} more
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBulkInvite}
                  disabled={inviting || csvData.length === 0}
                  className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {inviting ? 'Sending Invites...' : `Send ${csvData.length} Invites`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
