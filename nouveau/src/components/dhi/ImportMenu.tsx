import type { LucideIcon } from "lucide-react";
import { ChevronDown, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ImportOption = {
  key: string;
  label: string;
  /** Precise ce que l'action apporte, pour lever l'ambiguite a la lecture. */
  description?: string;
  icon?: LucideIcon;
  onSelect: () => void;
};

/**
 * Regroupe plusieurs actions de fichier derriere un bouton unique.
 *
 * `options` regroupe les imports, `secondary` les telechargements de modeles
 * dans une section distincte : deposer un fichier et recuperer un gabarit
 * ne se melangent pas.
 *
 * Chaque entree porte sa propre action : le composant n'a pas a connaitre les
 * routes, ce qui evite de le coupler au routeur et permet de le reutiliser
 * partout (campagne, produit, projet).
 */
export function ImportMenu({
  options,
  secondary,
  label,
  descriptionLabel,
  secondaryLabel,
  disabled = false,
}: {
  options: ImportOption[];
  secondary?: ImportOption[];
  label: string;
  descriptionLabel?: string;
  secondaryLabel?: string;
  disabled?: boolean;
}) {
  if (options.length === 0 && (secondary?.length ?? 0) === 0) return null;

  const renderItem = (option: ImportOption) => {
    const Icon = option.icon ?? Upload;
    return (
      <DropdownMenuItem
        key={option.key}
        onSelect={option.onSelect}
        className="items-start gap-3 py-2.5"
      >
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span className="flex flex-col gap-0.5">
          <span className="font-medium">{option.label}</span>
          {option.description ? (
            <span className="text-xs text-muted-foreground">{option.description}</span>
          ) : null}
        </span>
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={disabled}>
          <Upload className="size-4" />
          {label}
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{descriptionLabel ?? label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map(renderItem)}
        {secondary && secondary.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            {secondaryLabel ? <DropdownMenuLabel>{secondaryLabel}</DropdownMenuLabel> : null}
            {secondary.map(renderItem)}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
