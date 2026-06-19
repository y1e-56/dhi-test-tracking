import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useData } from '../contexts/DataContext';
import type { BreadcrumbItem } from '../components/ui/Breadcrumbs';

export function useBreadcrumbs(): BreadcrumbItem[] {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const params = useParams();
  const { projets, campagnes } = useData();

  return useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 0 || segments[0] === 'login') {
      return [{ label: t('nav.dashboard') }];
    }

    const dashboard = { label: t('nav.dashboard'), href: '/dashboard' };
    const adminLabel = t('breadcrumbs.administration');

    switch (segments[0]) {
      case 'dashboard':
        return [dashboard];

      case 'projets':
        return [dashboard, { label: t('nav.projects') }];

      case 'campagnes': {
        if (params.campagneId) {
          const campagne = campagnes.find(c => c.id === params.campagneId);
          const projet = campagne ? projets.find(p => p.id === campagne.projetId) : null;
          const items: BreadcrumbItem[] = [dashboard, { label: t('nav.projects') }];
          if (projet) {
            items.push({ label: projet.nom, href: `/campagnes?projetId=${projet.id}` });
          }
          items.push({ label: campagne?.nom ?? `#${params.campagneId}` });
          return items;
        }
        return [dashboard, { label: t('nav.campaigns') }];
      }

      case 'anomalies': {
        if (params.anomalieId) {
          return [dashboard, { label: t('breadcrumbs.anomaly', { id: params.anomalieId }) }];
        }
        return [dashboard, { label: t('nav.all_anomalies') }];
      }

      case 'admin':
        switch (segments[1]) {
          case 'anomalies':
            return [dashboard, { label: adminLabel }, { label: t('nav.all_anomalies') }];
          case 'utilisateurs':
            return [dashboard, { label: adminLabel }, { label: t('breadcrumbs.users') }];
          case 'history':
            return [dashboard, { label: adminLabel }, { label: t('breadcrumbs.history') }];
          case 'assignation':
            return [dashboard, { label: adminLabel }, { label: t('breadcrumbs.assignment') }];
          default:
            return [dashboard, { label: adminLabel }];
        }

      case 'testeur':
        if (segments[1] === 'taches') {
          return [dashboard, { label: t('breadcrumbs.my_tasks') }];
        }
        return [dashboard];

      case 'developpeur':
        if (segments[1] === 'anomalies') {
          return [dashboard, { label: t('breadcrumbs.my_anomalies') }];
        }
        return [dashboard];

      case 'reporting':
        return [dashboard, { label: t('nav.reporting') }];

      default:
        return [dashboard];
    }
  }, [pathname, params, t, projets, campagnes]);
}
