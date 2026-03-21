import { useState, useEffect } from 'react';
import {
  DollarSign,
  Search,
  Building2,
  X,
  Loader2,
  BookOpen,
  Eye,
  ExternalLink,
  Users,
  Copy,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from 'sonner';
import {
  adminCompanyOrdersService,
  type AdminCompanyOrderListItem,
  type AdminCompanyOrderDetail,
} from '../../services/adminCompanyOrders.service';
import {
  publicEnrollmentWizardService,
  type EnrollmentLinkStudent,
} from '../../services/publicEnrollmentWizard.service';

export function AdminCompanyPayments() {
  const [orders, setOrders] = useState<AdminCompanyOrderListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [totalCount, setTotalCount] = useState(0);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<AdminCompanyOrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Per-link students loaded in parallel when detail opens
  const [linkStudentsMap, setLinkStudentsMap] = useState<Record<string, EnrollmentLinkStudent[]>>({});
  const [allStudentsLoading, setAllStudentsLoading] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const orderDateOpts = { day: 'numeric' as const, month: 'short' as const, year: 'numeric' as const };

  const renderDateWithTime = (dateString: string | undefined | null, emptyLabel = 'N/A') => {
    if (!dateString) return emptyLabel;
    const d = new Date(dateString);
    return (
      <div className="leading-tight">
        <div>{d.toLocaleDateString('en-AU', orderDateOpts)}</div>
        <div className="text-xs text-gray-500 tabular-nums">{d.toLocaleTimeString('en-AU')}</div>
      </div>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await adminCompanyOrdersService.getCompanyOrders({
        page: 1,
        pageSize: 200,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      if (response.success && response.data) {
        setOrders(response.data.items ?? []);
        setTotalCount(response.data.totalCount ?? 0);
      } else {
        setOrders([]);
        setTotalCount(0);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load company orders');
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    if (!detailOrderId) {
      setDetailOrder(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailOrder(null);
    adminCompanyOrdersService
      .getCompanyOrderById(detailOrderId)
      .then((res) => {
        if (!cancelled && res.success && res.data) setDetailOrder(res.data);
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load order details');
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [detailOrderId]);

  const openDetails = (orderId: string) => {
    setDetailOrderId(orderId);
    setLinkStudentsMap({});
  };
  const closeDetails = () => setDetailOrderId(null);

  // Auto-load all students for all links when detail order is fetched
  useEffect(() => {
    if (!detailOrder?.links?.length) return;
    setAllStudentsLoading(true);
    Promise.all(
      detailOrder.links.map(async (link) => {
        try {
          const res = await publicEnrollmentWizardService.getLinkStudents(link.linkId);
          return { linkId: link.linkId, students: res.data?.students ?? [] };
        } catch {
          return { linkId: link.linkId, students: [] };
        }
      })
    ).then((results) => {
      const map: Record<string, EnrollmentLinkStudent[]> = {};
      results.forEach(({ linkId, students }) => { map[linkId] = students; });
      setLinkStudentsMap(map);
    }).finally(() => setAllStudentsLoading(false));
  }, [detailOrder]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatusId(orderId);
    try {
      const res = await adminCompanyOrdersService.updateCompanyOrderStatus(orderId, newStatus);
      if (res.success) {
        toast.success('Status updated');
        fetchOrders();
      } else {
        toast.error(res.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-gray-900 mb-2">Company Payments</h1>
        <p className="text-gray-600">
          View company orders: status, courses purchased, and payment details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Filter by status or search by company name/email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by company name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 min-w-[180px]"
            >
              <option value="">All statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <Button onClick={fetchOrders} variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Order History ({totalCount})</CardTitle>
          <CardDescription>
            Company orders with course count, total amount, and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company mobile number</TableHead>
                      <TableHead>Courses</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.orderId}>
                        <TableCell>{renderDateWithTime(order.createdAt)}</TableCell>
                        <TableCell className="max-w-[220px]">
                          <span
                            className="font-mono text-xs text-gray-700 break-all"
                            title={order.orderId}
                          >
                            {order.orderId}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-medium text-gray-900">
                              {order.companyName || '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{order.companyEmail}</TableCell>
                        <TableCell>{order.companyMobile || '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{order.courseCount}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(order.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">
                            {(order.paymentMethod || '').replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              order.status === 'Completed'
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : order.status === 'Pending'
                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                : 'border-red-200 bg-red-50 text-red-700'
                            }
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openDetails(order.orderId)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              Details
                            </Button>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                              disabled={updatingStatusId === order.orderId}
                              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-violet-500"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            {updatingStatusId === order.orderId && (
                              <Loader2 className="w-4 h-4 animate-spin inline ml-1" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {orders.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No company orders found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Company orders from the public enrollment flow will appear here
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detailOrderId} onOpenChange={(open) => !open && closeDetails()}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto pb-6 [-webkit-overflow-scrolling:touch]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Company Order Details
            </DialogTitle>
            <DialogDescription>
              Full order summary with all courses purchased and enrolled student details
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : detailOrder ? (
            <div className="space-y-6">

              {/* Company Info Banner */}
              <div className="flex flex-wrap items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-lg">{detailOrder.companyName || '—'}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="font-mono text-xs text-gray-500 break-all" title={detailOrder.orderId}>
                      {detailOrder.orderId}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        navigator.clipboard.writeText(detailOrder.orderId).then(() => toast.success('Order ID copied'))
                      }
                      className="p-1 rounded hover:bg-blue-100 text-blue-600 flex-shrink-0"
                      title="Copy order ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{detailOrder.companyEmail}</span>
                    {detailOrder.companyMobile && (
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{detailOrder.companyMobile}</span>
                    )}
                    <span className="flex items-start gap-1">
                      <Calendar className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      {renderDateWithTime(detailOrder.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-2xl font-bold text-blue-700">{formatCurrency(detailOrder.totalAmount)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 capitalize">{(detailOrder.paymentMethod || '').replace('_', ' ')}</span>
                    <Badge
                      variant="outline"
                      className={
                        detailOrder.status === 'Completed'
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : detailOrder.status === 'Pending'
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                      }
                    >
                      {detailOrder.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-violet-50 rounded-lg border border-violet-100">
                  <p className="text-2xl font-bold text-violet-700">{detailOrder.courseCount}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Courses Purchased</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-2xl font-bold text-green-700">
                    {Object.values(linkStudentsMap).reduce((s, arr) => s + arr.length, 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Students Enrolled</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-2xl font-bold text-blue-700">
                    {(detailOrder.links ?? []).filter(l => l.usedCount === 0).length}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Pending Links</p>
                </div>
              </div>

              {/* Course Links + Enrolled Students */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-violet-600" />
                  <h3 className="font-semibold text-gray-900">Courses &amp; Enrolled Students</h3>
                </div>

                {allStudentsLoading && (
                  <div className="flex items-center justify-center gap-2 py-4 text-gray-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading student details…
                  </div>
                )}

                {(detailOrder.links ?? []).map((link, idx) => {
                  const students = linkStudentsMap[link.linkId] ?? [];
                  const isLoaded = link.linkId in linkStudentsMap;
                  return (
                    <div key={link.linkId} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Course header */}
                      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-50 to-fuchsia-50 border-b border-gray-200">
                        <div className="w-7 h-7 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{link.courseName}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={`text-xs ${
                            students.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <Users className="w-3 h-3 mr-1" />
                            {students.length} enrolled
                          </Badge>
                          {link.fullUrl && (
                            <button
                              onClick={() => navigator.clipboard.writeText(link.fullUrl).then(() => toast.success('Link copied!'))}
                              className="p-1 rounded hover:bg-violet-100 text-violet-500" title="Copy enrollment link"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {link.fullUrl && (
                            <a href={link.fullUrl} target="_blank" rel="noopener noreferrer"
                              className="p-1 rounded hover:bg-violet-100 text-violet-500" title="Open link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Students table */}
                      {!isLoaded || allStudentsLoading ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                        </div>
                      ) : students.length === 0 ? (
                        <div className="flex flex-col items-center py-6 text-gray-400">
                          <Users className="w-8 h-8 mb-1 text-gray-300" />
                          <p className="text-sm">No one has enrolled via this link yet</p>
                          <p className="text-xs mt-0.5">Share the link above to get started</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                              <tr>
                                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 w-8">#</th>
                                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Name</th>
                                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Email</th>
                                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Phone</th>
                                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Enrolled On</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {students.map((s, i) => (
                                <tr key={s.studentId} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                                  <td className="px-4 py-2.5 font-medium text-gray-900">{s.fullName}</td>
                                  <td className="px-4 py-2.5 text-gray-600">{s.email}</td>
                                  <td className="px-4 py-2.5 text-gray-600">{s.phone || '—'}</td>
                                  <td className="px-4 py-2.5 text-gray-500 text-xs">
                                    {renderDateWithTime(s.enrolledAt, '—')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
