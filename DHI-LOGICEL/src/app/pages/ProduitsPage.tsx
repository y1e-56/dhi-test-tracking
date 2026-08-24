import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export function ProduitsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('nav.products')}</h2>
        <p className="text-sm text-muted-foreground">{t('products.subtitle')}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            {t('nav.products')}
          </CardTitle>
          <CardDescription>{t('products.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
          <Package className="h-10 w-10 opacity-40" />
          <p>{t('products.empty')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
