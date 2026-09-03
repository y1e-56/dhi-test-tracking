import { Check, ChevronsUpDown, X } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { ROLE_LABEL } from "@/lib/dhi-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export type MemberOption = {
  name: string;
  role: string;
  active: boolean;
};

export type MemberSelection = { label: string; labelPlural: string };

const sortMembers = (options: MemberOption[]) => {
  const activeTesters = options.filter((o) => o.active && o.role === "testeur");
  const activeOthers = options.filter((o) => o.active && o.role !== "testeur");
  const inactive = options.filter((o) => !o.active);
  return [...activeTesters, ...activeOthers, ...inactive];
};

export function MemberMultiSelect({
  value,
  onChange,
  options,
  placeholder,
  selectionLabel,
  showRole = true,
  className,
}: {
  value: Set<string>;
  onChange: (next: Set<string>) => void;
  options: MemberOption[];
  placeholder?: string;
  selectionLabel: MemberSelection;
  showRole?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const sorted = sortMembers(options);
  const visible = query
    ? sorted.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
    : sorted;
  const selectedCount = value.size;

  const toggle = (name: string, active: boolean) => {
    if (!active) return;
    onChange(
      new Set(value.has(name) ? [...value].filter((n) => n !== name) : [...value, name]),
    );
  };

  const clear = () => onChange(new Set());

  const label = selectedCount === 0
    ? placeholder
    : `${selectedCount} ${selectedCount === 1 ? selectionLabel.label : selectionLabel.labelPlural}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("h-10 justify-between font-normal", className)}
        >
          <span className="truncate">{label}</span>
          <span className="flex items-center gap-1">
            {selectedCount > 0 ? (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {selectedCount}
              </Badge>
            ) : null}
            {selectedCount > 0 ? (
              <X
                className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  clear();
                }}
              />
            ) : null}
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(24rem,calc(100vw-2rem)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("pages.add_campaign.recherche_membre")}
            value={query}
            onValueChange={setQuery}
          />
          <div className="flex items-center justify-between border-b px-3 py-1.5 text-xs text-muted-foreground">
            <span>{selectedCount}/{sorted.filter((o) => o.active).length} {t("pages.add_campaign.selectionnes_compteur")}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChange(new Set(sorted.filter((o) => o.active).map((o) => o.name)))}
                className="font-medium text-primary hover:underline"
              >
                {t("pages.add_campaign.tout_selectionner")}
              </button>
              <button
                type="button"
                onClick={clear}
                className="font-medium text-destructive hover:underline"
              >
                {t("pages.add_campaign.tout_effacer")}
              </button>
            </div>
          </div>
          <CommandList className="max-h-56">
            <CommandEmpty>{t("pages.add_campaign.aucun_membre_trouve")}</CommandEmpty>
            <CommandGroup>
              {visible.map((o) => (
                <CommandItem
                  key={o.name}
                  value={o.name}
                  onSelect={() => toggle(o.name, o.active)}
                  disabled={!o.active}
                  className={cn("gap-2", !o.active && "opacity-50")}
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-sm border",
                      value.has(o.name) ? "bg-primary border-primary text-primary-foreground" : "border-border",
                    )}
                  >
                    {value.has(o.name) ? <Check className="h-3 w-3" /> : null}
                  </div>
                  <span className="flex-1 truncate">{o.name}</span>
                  {showRole ? (
                    <Badge variant="outline" className="mr-2 text-[10px] font-normal">
                      {ROLE_LABEL[o.role as keyof typeof ROLE_LABEL] ?? o.role}
                    </Badge>
                  ) : null}
                  {!o.active ? (
                    <span className="text-xs text-muted-foreground">{t("pages.add_campaign.inactif")}</span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <div className="border-t p-2">
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setOpen(false)}>
              {t("pages.campaign_detail.fermer")}
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}