type TFunc = (key: string, options?: Record<string, unknown>) => string;

export function getHistoriqueActionLabel(action: string, t: TFunc): string {
  const key = `anomalie.detail.history_action.${action}`;
  const translated = t(key);
  return translated === key ? action : translated;
}

export function formatHistoriqueDescription(desc: string, t: TFunc): string {
  const translateStatus = (s: string) => {
    const key = `anomalie.detail.history_status.${s}`;
    const translated = t(key);
    return translated === key ? s : translated;
  };
  return desc
    .replace(/passée en "([^"]+)"/g, (_, s) => t('anomalie.detail.history_status_prefix', { status: translateStatus(s) }))
    .replace(/"([^"]+)"/g, (_, s) => translateStatus(s));
}
