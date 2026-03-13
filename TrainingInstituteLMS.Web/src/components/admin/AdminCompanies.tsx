import { useState, useEffect } from 'react';
import { Building2, Plus, Search, Edit, Trash2, Mail, Lock, Eye, EyeOff, X, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { toast } from 'sonner';
import { companyManagementService, type CompanyResponse } from '../../services/companyManagement.service';

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
    return new Date(dateString).toLocaleDateString();
  };

  const totalPages = Math.ceil(totalCount / pageSize);

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
                        <TableCell>{formatDate(company.createdAt)}</TableCell>
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
