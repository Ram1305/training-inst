import { useState, useEffect } from 'react';
import { Building2, Plus, Search, Edit, Trash2, Mail, Lock, Eye, EyeOff, X, Phone, Loader2, BookOpen, ExternalLink, Users, Copy, Calendar, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { toast } from 'sonner';
import {
  companyManagementService,
  type CompanyResponse,
  type CompanyPortalEnrollmentRow,
} from '../../services/companyManagement.service';
import { adminCompanyOrdersService, type AdminCompanyOrderDetail } from '../../services/adminCompanyOrders.service';
import { publicEnrollmentWizardService, type EnrollmentLinkStudent } from '../../services/publicEnrollmentWizard.service';

export function AdminCompanies() {
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('all');

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyResponse | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // View detail dialog
  const [viewCompany, setViewCompany] = useState<CompanyResponse | null>(null);
  const [viewOrders, setViewOrders] = useState<AdminCompanyOrderDetail[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewStudentsMap, setViewStudentsMap] = useState<Record<string, EnrollmentLinkStudent[]>>({});
  const [viewStudentsLoading, setViewStudentsLoading] = useState(false);
  const [viewPortalRows, setViewPortalRows] = useState<CompanyPortalEnrollmentRow[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    mobileNumber: '',
  });

  const fetchCompanies = async (query?: string) => {
    if (companies.length === 0) {
      setLoading(true);
    }
    try {
      const response = await companyManagementService.getAllCompanies({
        searchQuery: (query ?? searchQuery) || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        pageNumber: currentPage,
        pageSize: pageSize,
      });

      if (response.success) {
        setCompanies(response.data.companies ?? []);
        setTotalCount(response.data.totalCount ?? 0);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies(searchQuery);
    }, searchQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [currentPage, searchQuery, statusFilter]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await companyManagementService.createCompany({
        companyName: formData.companyName,
        email: formData.email,
        password: formData.password,
        mobileNumber: formData.mobileNumber,
      });

      if (response.success) {
        toast.success('Company created successfully!');
        setCreateDialogOpen(false);
        resetForm();
        fetchCompanies();
      } else {
        toast.error(response.message || 'Failed to create company');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    setLoading(true);
    try {
      const response = await companyManagementService.updateCompany(selectedCompany.companyId, {
        companyName: formData.companyName,
        email: formData.email,
        password: formData.password || undefined,
        mobileNumber: formData.mobileNumber,
      });

      if (response.success) {
        toast.success('Company updated successfully!');
        setEditDialogOpen(false);
        setSelectedCompany(null);
        resetForm();
        fetchCompanies();
      } else {
        toast.error(response.message || 'Failed to update company');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update company');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (companyId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    setLoading(true);
    try {
      const response = await companyManagementService.deleteCompany(companyId);

      if (response.success) {
        toast.success('Company deleted successfully!');
        fetchCompanies();
      } else {
        toast.error(response.message || 'Failed to delete company');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete company');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (companyId: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      const response = await companyManagementService.toggleCompanyStatus(companyId);

      if (response.success) {
        toast.success(`Company ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
        fetchCompanies();
      } else {
        toast.error(response.message || 'Failed to toggle company status');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to toggle company status');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (company: CompanyResponse) => {
    setSelectedCompany(company);
    setFormData({
      companyName: company.companyName,
      email: company.email,
      password: '',
      mobileNumber: company.mobileNumber || '',
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      email: '',
      password: '',
      mobileNumber: '',
    });
    setShowPassword(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const renderDateWithTime = (
    dateString: string | undefined | null,
    options: { emptyLabel?: string; dateStyle?: 'company' | 'enrolled' } = {}
  ) => {
    const { emptyLabel = 'Never', dateStyle = 'company' } = options;
    if (!dateString) return emptyLabel;
    const d = new Date(dateString);
    const dateOpts =
      dateStyle === 'enrolled'
        ? ({ day: 'numeric', month: 'short', year: 'numeric' } as const)
        : ({ day: '2-digit', month: '2-digit', year: 'numeric' } as const);
    return (
      <div className="leading-tight">
        <div>{d.toLocaleDateString('en-AU', dateOpts)}</div>
        <div className="text-xs text-gray-500 tabular-nums">{d.toLocaleTimeString('en-AU')}</div>
      </div>
    );
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);

  const openViewDialog = async (company: CompanyResponse) => {
    setViewCompany(company);
    setViewOrders([]);
    setViewStudentsMap({});
    setViewPortalRows([]);
    setExpandedOrderId(null);
    setViewLoading(true);
    try {
      const [portalRes, res] = await Promise.all([
        companyManagementService.getPortalEnrollments(company.companyId),
        adminCompanyOrdersService.getCompanyOrders({ search: company.email, pageSize: 200 }),
      ]);
      if (portalRes.success && portalRes.data?.items) {
        setViewPortalRows(portalRes.data.items);
      }

      const emailKey = company.email.trim().toLowerCase();
      const rawItems = res.data?.items ?? [];
      const itemsHaveEmail = rawItems.some((i) => Boolean(i.companyEmail?.trim()));
      const items = itemsHaveEmail
        ? rawItems.filter((item) => (item.companyEmail?.trim().toLowerCase() ?? '') === emailKey)
        : rawItems;
      // Fetch full detail (links) for each order in parallel
      const details = await Promise.all(
        items.map(async (item) => {
          try {
            const d = await adminCompanyOrdersService.getCompanyOrderById(item.orderId);
            return d.data ?? { ...item, links: [] };
          } catch {
            return { ...item, links: [] } as AdminCompanyOrderDetail;
          }
        })
      );
      setViewOrders(details);
      setExpandedOrderId(details[0]?.orderId ?? null);
      // Auto-load all students for all links in all orders
      setViewStudentsLoading(true);
      const allLinks = details.flatMap(d => d.links ?? []);
      const results = await Promise.all(
        allLinks.map(async (link) => {
          try {
            const r = await publicEnrollmentWizardService.getLinkStudents(link.linkId);
            return { linkId: link.linkId, students: r.data?.students ?? [] };
          } catch {
            return { linkId: link.linkId, students: [] };
          }
        })
      );
      const map: Record<string, EnrollmentLinkStudent[]> = {};
      results.forEach(({ linkId, students }) => { map[linkId] = students; });
      setViewStudentsMap(map);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load company details');
    } finally {
      setViewLoading(false);
      setViewStudentsLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const totalPurchasedSeats = viewOrders.reduce(
    (sum, order) =>
      sum +
      (order.links ?? []).reduce((orderSum, link) => orderSum + (link.maxUses && link.maxUses > 0 ? link.maxUses : 1), 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Companies</h2>
          <p className="text-gray-600 text-sm">Manage company accounts</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={(open) => { setCreateDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Company</DialogTitle>
              <DialogDescription>
                Fill in company name, email, and password to create a company account
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-company-name">Company Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="create-company-name"
                    placeholder="Acme Corp"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="create-email"
                    type="email"
                    placeholder="company@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-mobile">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="create-mobile"
                    type="tel"
                    placeholder="0400 000 000"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="create-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Add Company'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find companies by name or email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'active' | 'inactive' | 'all');
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button onClick={() => fetchCompanies()} variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Accounts ({totalCount})</CardTitle>
          <CardDescription>Manage company registrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
              <p className="mt-2 text-gray-500">Loading...</p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company mobile number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.companyId}>
                        <TableCell>{renderDateWithTime(company.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div className="font-medium text-gray-900">{company.companyName}</div>
                          </div>
                        </TableCell>
                        <TableCell>{company.email}</TableCell>
                        <TableCell>{company.mobileNumber || '—'}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              company.isActive
                                ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                            }
                          >
                            {company.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(company.lastLoginAt)}</TableCell>
                        <TableCell>
                        <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openViewDialog(company)}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-violet-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(company)}
                              disabled={loading}
                              title="Edit Company"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(company.companyId, company.isActive)}
                              disabled={loading}
                              title={company.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {company.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteCompany(company.companyId, company.companyName)}
                              disabled={loading}
                              title="Delete Company"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {companies.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No companies found</p>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="px-3 py-1 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Company View Detail Dialog — sizes via .admin-company-detail-dialog in index.css (prebuilt CSS omits arbitrary h/w). */}
      <Dialog open={!!viewCompany} onOpenChange={(open) => { if (!open) setViewCompany(null); }}>
        <DialogContent className="admin-company-detail-dialog flex flex-col gap-0 overflow-hidden rounded-2xl border border-violet-100/80 p-0 shadow-2xl">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="relative z-10 flex-shrink-0 border-b border-violet-100/90 bg-gradient-to-br from-slate-50 via-white to-violet-50/40 px-6 pb-5 pt-6 pr-14">
              <DialogHeader className="space-y-2 text-left">
                <DialogTitle className="flex items-start gap-4 pr-0 sm:pr-2">
                  <span className="mt-0.5 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-500/25">
                    <Building2 className="h-6 w-6 text-white" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                      {viewCompany?.companyName}
                    </span>
                    <span className="mt-1 block text-sm text-gray-600">
                      Live enrolment list, orders, and per-link students
                    </span>
                  </span>
                </DialogTitle>
                <DialogDescription className="max-w-2xl text-left text-gray-600">
                  The table below lists every company enrolment (course, LLND, form, payment). Further down you can open
                  orders and copy share links.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-gray-50/80 to-white px-4 py-5 pb-8 sm:px-6 sm:py-6 [-webkit-overflow-scrolling:touch]">
              {viewLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                  <span className="ml-3 text-gray-500">Loading enrolments, orders, and students…</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Company info banner */}
                  <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-violet-200/60 bg-white p-5 shadow-sm ring-1 ring-violet-100/80">
                    <div className="min-w-0 flex-1 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Company profile</p>
                      <div className="flex flex-col gap-3 text-sm text-gray-700 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                            <Mail className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 break-all font-medium text-gray-900">{viewCompany?.email}</span>
                        </span>
                        {viewCompany?.mobileNumber && (
                          <span className="inline-flex items-center gap-2">
                            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                              <Phone className="h-4 w-4" />
                            </span>
                            <span className="font-medium text-gray-900">{viewCompany.mobileNumber}</span>
                          </span>
                        )}
                        <span className="inline-flex items-start gap-2">
                          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                            <Calendar className="h-4 w-4" />
                          </span>
                          <span className="leading-tight">
                            <span className="text-xs text-gray-500 block">Joined</span>
                            {viewCompany?.createdAt ? (
                              <>
                                <span className="font-medium text-gray-900 block">
                                  {new Date(viewCompany.createdAt).toLocaleDateString('en-AU', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })}
                                </span>
                                <span className="text-xs text-gray-500 tabular-nums block">
                                  {new Date(viewCompany.createdAt).toLocaleTimeString('en-AU')}
                                </span>
                              </>
                            ) : (
                              <span className="font-medium text-gray-900 block">Never</span>
                            )}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-stretch gap-2 sm:items-end">
                      <Badge
                        className={
                          viewCompany?.isActive
                            ? 'border border-green-200 bg-green-50 px-3 py-1 text-green-800 hover:bg-green-50'
                            : 'border border-gray-200 bg-gray-50 px-3 py-1 text-gray-700 hover:bg-gray-50'
                        }
                      >
                        {viewCompany?.isActive ? 'Active account' : 'Inactive account'}
                      </Badge>
                      <span className="text-right text-xs text-gray-500">Last login: {formatDate(viewCompany?.lastLoginAt)}</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex items-center gap-4 rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/30">
                        <Package className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold tabular-nums text-violet-800">{viewOrders.length}</p>
                        <p className="text-xs font-medium text-gray-600">Orders</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold tabular-nums text-blue-800">
                          {totalPurchasedSeats}
                        </p>
                        <p className="text-xs font-medium text-gray-600">Seats purchased</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/30">
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold tabular-nums text-emerald-800">
                          {viewPortalRows.length}
                        </p>
                        <p className="text-xs font-medium text-gray-600">Company enrolments</p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-md shadow-gray-200/50 ring-1 ring-gray-100">
                    <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50/40 px-4 py-3 sm:px-5">
                      <p className="text-sm font-semibold text-gray-900">Students registered under this company</p>
                      <p className="mt-0.5 text-xs text-gray-600">
                        Each row is one enrolment: course purchased, amount, payment status, LLND assessment, enrolment
                        form, and training progress. Updates automatically when students complete steps.
                      </p>
                    </div>
                    {viewPortalRows.length === 0 ? (
                      <p className="px-4 py-10 text-center text-sm text-gray-500 sm:px-5">
                        No company enrolments yet. Staff appear here after they use the company portal link or a
                        company-order course link.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-sm">
                          <thead className="border-b border-gray-200 bg-gray-50/90">
                            <tr>
                              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                #
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Student
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Course
                              </th>
                              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Amount
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Payment
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                LLND
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Enrolment form
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Training
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Enrolled
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Bill
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {viewPortalRows.map((r, ri) => (
                              <tr key={r.enrollmentId} className="transition-colors hover:bg-violet-50/40">
                                <td className="px-3 py-3 text-xs text-gray-400">{ri + 1}</td>
                                <td className="px-3 py-3">
                                  <div className="font-medium text-gray-900">{r.studentName}</div>
                                  <div className="max-w-[200px] truncate text-xs text-gray-500" title={r.studentEmail}>
                                    {r.studentEmail ?? '—'}
                                  </div>
                                  {r.studentPhone ? (
                                    <div className="text-xs text-gray-500">{r.studentPhone}</div>
                                  ) : null}
                                </td>
                                <td className="px-3 py-3 text-gray-800">{r.courseName}</td>
                                <td className="px-3 py-3 text-right tabular-nums text-gray-800">
                                  {formatCurrency(r.amountPaid ?? 0)}
                                </td>
                                <td className="px-3 py-3">
                                  <Badge variant="outline" className="text-xs font-normal">
                                    {r.paymentStatus || '—'}
                                  </Badge>
                                </td>
                                <td className="px-3 py-3">
                                  <Badge
                                    variant="outline"
                                    className={
                                      r.llnAssessmentCompleted
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 text-xs'
                                        : 'border-amber-200 bg-amber-50 text-amber-800 text-xs'
                                    }
                                  >
                                    {r.llnAssessmentCompleted ? 'Completed' : 'Not completed'}
                                  </Badge>
                                </td>
                                <td className="px-3 py-3">
                                  <Badge
                                    variant="outline"
                                    className={
                                      r.enrollmentFormCompleted
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 text-xs'
                                        : 'border-gray-200 bg-gray-50 text-gray-600 text-xs'
                                    }
                                  >
                                    {r.enrollmentFormCompleted ? 'Submitted' : 'Not submitted'}
                                  </Badge>
                                </td>
                                <td className="px-3 py-3">
                                  <Badge variant="secondary" className="text-xs font-normal">
                                    {r.status}
                                  </Badge>
                                  {r.completedAt ? (
                                    <div className="mt-1 text-xs text-gray-500">
                                      Done {new Date(r.completedAt).toLocaleDateString('en-AU')}
                                    </div>
                                  ) : null}
                                </td>
                                <td className="px-3 py-3 text-xs text-gray-600">
                                  {renderDateWithTime(r.enrolledAt, { emptyLabel: '—', dateStyle: 'enrolled' })}
                                </td>
                                <td className="px-3 py-3">
                                  {r.hasCompanyBill ? (
                                    <Badge
                                      variant={r.companyBillStatus === 'Paid' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {r.companyBillStatus ?? '—'}
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-gray-400">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {viewOrders.length === 0 ? (
                    <div className="flex flex-col items-center py-14 text-gray-400">
                      <BookOpen className="w-12 h-12 mb-3 text-gray-300" />
                      <p className="font-semibold text-gray-700">No bulk orders found</p>
                      <p className="text-sm mt-1 max-w-md text-center text-gray-500">
                        Company course orders (with share links) appear here. Students who only used the permanent
                        company portal still appear in the table above.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {viewOrders.map((order, oi) => (
                        <div key={order.orderId} className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-md shadow-gray-200/50 ring-1 ring-gray-100">
                          {/* Order header */}
                          <button
                            type="button"
                            className="flex w-full flex-wrap items-center gap-3 px-4 py-4 text-left transition-colors sm:flex-nowrap sm:px-5 bg-gradient-to-r from-slate-50 to-gray-50 hover:from-violet-50/80 hover:to-slate-50"
                            onClick={() => setExpandedOrderId(expandedOrderId === order.orderId ? null : order.orderId)}
                          >
                            <div className="w-7 h-7 bg-slate-700 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {oi + 1}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="font-semibold text-gray-900 text-sm leading-tight block">
                                  <span className="block">
                                    Order —{' '}
                                    {order.createdAt
                                      ? new Date(order.createdAt).toLocaleDateString('en-AU', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                        })
                                      : '—'}
                                  </span>
                                  {order.createdAt ? (
                                    <span className="block text-xs font-normal text-gray-500 tabular-nums">
                                      {new Date(order.createdAt).toLocaleTimeString('en-AU')}
                                    </span>
                                  ) : null}
                                </span>
                                <span className="text-xs text-gray-500 capitalize">{(order.paymentMethod || '').replace('_', ' ')}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5 truncate">
                                {order.orderId}
                              </div>
                            </div>
                            <span className="font-bold text-blue-700 text-sm whitespace-nowrap">{formatCurrency(order.totalAmount)}</span>
                            <Badge
                              variant="outline"
                              className={
                                order.status === 'Completed' ? 'border-green-200 bg-green-50 text-green-700 text-xs'
                                  : order.status === 'Pending' ? 'border-amber-200 bg-amber-50 text-amber-700 text-xs'
                                    : 'border-red-200 bg-red-50 text-red-700 text-xs'
                              }
                            >
                              {order.status}
                            </Badge>
                            {expandedOrderId === order.orderId
                              ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                          </button>

                          {/* Courses + students inside order */}
                          {expandedOrderId === order.orderId && (
                            <div className="divide-y divide-gray-100">
                              {(order.links ?? []).length === 0 ? (
                                <p className="text-center text-gray-400 py-8 text-sm">No course links in this order</p>
                              ) : (
                                (order.links ?? []).map((link, li) => {
                                  const students = viewStudentsMap[link.linkId] ?? [];
                                  const isLoaded = link.linkId in viewStudentsMap;
                                  const seatCount = link.maxUses && link.maxUses > 0 ? link.maxUses : 1;
                                  return (
                                    <div key={link.linkId}>
                                      {/* Course header */}
                                      <div className="flex flex-wrap items-center gap-3 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50/40 px-4 py-3 sm:px-5">
                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                                          {li + 1}
                                        </div>
                                        <span className="min-w-0 flex-1 text-sm font-semibold text-gray-900 sm:truncate">{link.courseName}</span>
                                        <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto sm:justify-end">
                                          <Badge
                                            className="border border-blue-200 bg-blue-50 text-blue-800 text-xs"
                                          >
                                            {seatCount} {seatCount === 1 ? 'seat' : 'seats'}
                                          </Badge>
                                          <Badge
                                            className={`text-xs ${students.length > 0 ? 'border border-emerald-200 bg-emerald-50 text-emerald-800' : 'border border-gray-200 bg-gray-50 text-gray-600'}`}
                                          >
                                            <Users className="mr-1 h-3 w-3" />
                                            {students.length} enrolled
                                          </Badge>
                                          {link.fullUrl && (
                                            <>
                                              <button
                                                type="button"
                                                onClick={() => navigator.clipboard.writeText(link.fullUrl).then(() => toast.success('Link copied!'))}
                                                className="rounded-lg p-2 text-violet-600 transition-colors hover:bg-white/80"
                                                title="Copy link"
                                              >
                                                <Copy className="h-4 w-4" />
                                              </button>
                                              <a
                                                href={link.fullUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="rounded-lg p-2 text-violet-600 transition-colors hover:bg-white/80"
                                                title="Open link"
                                              >
                                                <ExternalLink className="h-4 w-4" />
                                              </a>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {/* Students table */}
                                      {!isLoaded || viewStudentsLoading ? (
                                        <div className="flex justify-center py-6">
                                          <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                                        </div>
                                      ) : students.length === 0 ? (
                                        <div className="flex flex-col items-center py-8 text-gray-400">
                                          <Users className="w-7 h-7 mb-2 text-gray-300" />
                                          <p className="text-sm">No students enrolled yet</p>
                                        </div>
                                      ) : (
                                        <div className="overflow-x-auto rounded-b-xl bg-white">
                                          <table className="w-full min-w-[960px] text-sm">
                                            <thead className="border-b border-gray-200 bg-gray-50/90">
                                              <tr>
                                                <th className="w-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">#</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Course</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Payment</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">LLND</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Form</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Training</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Enrolled</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                              {students.map((s, si) => (
                                                <tr
                                                  key={s.enrollmentId ?? `${link.linkId}-${s.studentId}-${si}`}
                                                  className="transition-colors hover:bg-violet-50/40"
                                                >
                                                  <td className="px-4 py-3 text-xs text-gray-400">{si + 1}</td>
                                                  <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-900">{s.fullName}</div>
                                                    <div className="max-w-[180px] truncate text-xs text-gray-500" title={s.email}>
                                                      {s.email}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{s.phone || '—'}</div>
                                                  </td>
                                                  <td className="px-4 py-3 text-gray-800">{s.courseName ?? link.courseName}</td>
                                                  <td className="px-4 py-3 text-right tabular-nums text-gray-800">
                                                    {formatCurrency(s.amountPaid ?? 0)}
                                                  </td>
                                                  <td className="px-4 py-3 text-xs text-gray-700">{s.paymentStatus ?? '—'}</td>
                                                  <td className="px-4 py-3">
                                                    <Badge
                                                      variant="outline"
                                                      className={
                                                        s.llnAssessmentCompleted
                                                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 text-xs'
                                                          : 'border-amber-200 bg-amber-50 text-amber-800 text-xs'
                                                      }
                                                    >
                                                      {s.llnAssessmentCompleted ? 'Done' : 'Pending'}
                                                    </Badge>
                                                  </td>
                                                  <td className="px-4 py-3">
                                                    <Badge
                                                      variant="outline"
                                                      className={
                                                        s.enrollmentFormCompleted
                                                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 text-xs'
                                                          : 'border-gray-200 bg-gray-50 text-gray-600 text-xs'
                                                      }
                                                    >
                                                      {s.enrollmentFormCompleted ? 'Yes' : 'No'}
                                                    </Badge>
                                                  </td>
                                                  <td className="px-4 py-3 text-xs text-gray-700">{s.status ?? '—'}</td>
                                                  <td className="px-4 py-3 text-xs text-gray-600">
                                                    {renderDateWithTime(s.enrolledAt, { emptyLabel: '—', dateStyle: 'enrolled' })}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) { setSelectedCompany(null); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>Update company information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditCompany} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-company-name">Company Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="edit-company-name"
                  placeholder="Acme Corp"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="company@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-mobile">Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="edit-mobile"
                  type="tel"
                  placeholder="0400 000 000"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">New Password (optional)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="edit-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Leave empty to keep current"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10"
                  minLength={6}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setEditDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Company'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
