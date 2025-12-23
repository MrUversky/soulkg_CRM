/**
 * ProductsList Component
 * 
 * Displays products and tours for a client.
 * Allows adding and removing products.
 */

'use client';

import { useState } from 'react';
import { useClientProducts, useAddClientProduct, useRemoveClientProduct } from '@/lib/hooks/useClients';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ClientProduct, ClientTour, ClientProductStatus } from '@/types/client';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Package, Calendar, Trash2, Plus, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface ProductsListProps {
  clientId: string;
}

const STATUS_COLORS: Record<ClientProductStatus, string> = {
  INTERESTED: 'bg-info-100 text-info-800 dark:bg-info-900 dark:text-info-300',
  PROPOSED: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-300',
  SELECTED: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300',
  BOOKED: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
};

export default function ProductsList({ clientId }: ProductsListProps) {
  const { toast } = useToast();
  const locale = useLocale();
  const t = useTranslations();
  const { data, isLoading, error } = useClientProducts(clientId);
  const addProductMutation = useAddClientProduct();
  const removeProductMutation = useRemoveClientProduct();

  const [showAddForm, setShowAddForm] = useState(false);
  const [productId, setProductId] = useState('');
  const [status, setStatus] = useState<ClientProductStatus>('INTERESTED');
  const [notes, setNotes] = useState('');

  // Create STATUS_LABELS dynamically using translations
  const STATUS_LABELS: Record<ClientProductStatus, string> = {
    INTERESTED: t('products.statusLabels.INTERESTED'),
    PROPOSED: t('products.statusLabels.PROPOSED'),
    SELECTED: t('products.statusLabels.SELECTED'),
    BOOKED: t('products.statusLabels.BOOKED'),
  };

  const handleAddProduct = async () => {
    if (!productId.trim()) {
      toast({
        title: t('common.error'),
        description: t('products.pleaseEnterProductId'),
        variant: 'error',
      });
      return;
    }

    try {
      await addProductMutation.mutateAsync({
        clientId,
        data: {
          productId: productId.trim(),
          status,
          notes: notes.trim() || undefined,
        },
      });

      toast({
        title: t('common.success'),
        description: t('products.productAdded'),
        variant: 'success',
      });

      // Reset form
      setProductId('');
      setStatus('INTERESTED');
      setNotes('');
      setShowAddForm(false);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.response?.data?.error || t('products.failedToAddProduct'),
        variant: 'error',
      });
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!confirm(t('products.confirmRemoveProduct'))) {
      return;
    }

    try {
      await removeProductMutation.mutateAsync({
        clientId,
        productId,
      });

      toast({
        title: t('common.success'),
        description: t('products.productRemoved'),
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.response?.data?.error || t('products.failedToRemoveProduct'),
        variant: 'error',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-error-600 dark:text-error-400 mb-6">
              {t('products.failedToLoadProducts')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const products = data?.products || [];
  const tours = data?.tours || [];

  return (
    <div className="space-y-6">
      {/* Products Section */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-text-primary flex items-center gap-2">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            {t('products.title', { count: products.length })}
          </h3>
          {!showAddForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('products.addProduct')}
            </Button>
          )}
        </div>

        {/* Add Product Form */}
        {showAddForm && (
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-text-primary">{t('products.addProductForm')}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddForm(false);
                      setProductId('');
                      setStatus('INTERESTED');
                      setNotes('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      {t('products.productId')}
                    </label>
                    <Input
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      placeholder={t('products.productIdPlaceholder')}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      {t('products.status')}
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ClientProductStatus)}
                      className="flex h-10 w-full rounded-lg border border-input/50 bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {t('products.notesOptional')}
                  </label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('products.notesPlaceholder')}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddProduct}
                    disabled={addProductMutation.isPending}
                  >
                    {addProductMutation.isPending ? t('products.adding') : t('products.addProduct')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setProductId('');
                      setStatus('INTERESTED');
                      setNotes('');
                    }}
                  >
                    {t('products.cancel')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products List */}
        {products.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary mb-2">{t('products.noProducts')}</p>
                <p className="text-sm text-text-tertiary">
                  {t('products.noProductsDescription')}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {products.map((product: ClientProduct) => (
              <Card key={product.id}>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h4 className="font-semibold text-text-primary text-sm sm:text-base">
                            {product.product.name}
                          </h4>
                          <span
                            className={cn(
                              'px-2 py-1 rounded text-xs font-medium self-start',
                              STATUS_COLORS[product.status]
                            )}
                          >
                            {STATUS_LABELS[product.status]}
                          </span>
                        </div>
                        {product.product.description && (
                          <p className="text-xs sm:text-sm text-text-secondary mb-2">
                            {product.product.description}
                          </p>
                        )}
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-text-tertiary">
                          <span>
                            {t('products.price')}: {product.product.basePrice} {product.product.currency}
                          </span>
                          <span>{t('products.type')}: {product.product.type}</span>
                          <span>{t('products.added')}: {formatDate(product.createdAt, locale)}</span>
                        </div>
                        {product.notes && (
                          <p className="text-xs sm:text-sm text-text-secondary mt-2 italic">
                            {t('products.note')}: {product.notes}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveProduct(product.productId)}
                        disabled={removeProductMutation.isPending}
                        className="text-error-600 hover:text-error-700 hover:bg-error-50 dark:hover:bg-error-900/20 self-start sm:self-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Tours Section */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5" />
          {t('products.tours.title', { count: tours.length })}
        </h3>

        {tours.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary mb-2">{t('products.tours.noTours')}</p>
                <p className="text-sm text-text-tertiary">
                  {t('products.tours.noToursDescription')}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {tours.map((tour: ClientTour) => (
              <Card key={tour.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-text-primary">
                          {tour.tour.product.name}
                        </h4>
                        <span
                          className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            STATUS_COLORS[tour.status as ClientProductStatus] || STATUS_COLORS.INTERESTED
                          )}
                        >
                          {tour.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-text-tertiary mb-2">
                        <span>
                          {formatDate(tour.tour.startDate, locale)} - {formatDate(tour.tour.endDate, locale)}
                        </span>
                        {tour.tour.price && (
                          <span>
                            {t('products.price')}: {tour.tour.price} {tour.tour.currency}
                          </span>
                        )}
                        {tour.participants && (
                          <span>{t('products.tours.participants')}: {tour.participants}</span>
                        )}
                        <span>{t('products.tours.status')}: {tour.tour.status}</span>
                      </div>
                      {tour.notes && (
                        <p className="text-sm text-text-secondary mt-2 italic">
                          {t('products.note')}: {tour.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

