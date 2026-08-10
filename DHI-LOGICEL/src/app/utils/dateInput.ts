export function toDateInput(value?: string): string {
  return value ? value.slice(0, 10) : '';
}
