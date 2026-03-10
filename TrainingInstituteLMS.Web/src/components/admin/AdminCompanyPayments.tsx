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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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

  const openDetails = (orderId: string) => setDetailOrderId(orderId);
  const closeDetails = () => setDetailOrderId(null);

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
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order details</DialogTitle>
            <DialogDescription>
              Company order summary and courses purchased for the selected order
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : detailOrder ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{detailOrder.companyName || '—'}</p>
                  <p className="text-sm text-gray-600">{detailOrder.companyEmail}</p>
                  {detailOrder.companyMobile && (
                    <p className="text-xs text-gray-500">{detailOrder.companyMobile}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Total amount</span>
                  <p className="font-semibold">{formatCurrency(detailOrder.totalAmount)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Payment</span>
                  <p className="capitalize">{(detailOrder.paymentMethod || '').replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-gray-500">Date</span>
                  <p>{formatDate(detailOrder.createdAt)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status</span>
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
              <div className="pt-3 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-violet-600" />
                  <span className="font-semibold text-gray-900">
                    Courses purchased: {detailOrder.courseCount}
                  </span>
                </div>
                <ul className="space-y-1.5 pl-1">
                  {detailOrder.links?.map((link) => (
                    <li
                      key={link.linkId}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <span className="text-violet-600">•</span>
                      <span>{link.courseName}</span>
                      {link.fullUrl && (
                        <a
                          href={link.fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-600 hover:underline flex items-center gap-0.5"
                          title="Open link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
