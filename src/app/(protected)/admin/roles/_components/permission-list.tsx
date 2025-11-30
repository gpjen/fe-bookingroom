"use client";

import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Permission } from "./types";

interface PermissionListProps {
  permissions: Permission[];
  selectedPermissions: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  readOnly?: boolean;
}

export function PermissionList({
  permissions,
  selectedPermissions,
  onSelectionChange,
  readOnly = false,
}: PermissionListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Group permissions by 'group' field
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    
    permissions.forEach((permission) => {
      // Filter by search query
      if (
        searchQuery && 
        !permission.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !permission.group.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return;
      }

      if (!groups[permission.group]) {
        groups[permission.group] = [];
      }
      groups[permission.group].push(permission);
    });

    return groups;
  }, [permissions, searchQuery]);

  const handleGroupToggle = (groupName: string, checked: boolean) => {
    if (readOnly) return;

    const groupPermissionIds = groupedPermissions[groupName].map((p) => p.id);
    let newSelected = [...selectedPermissions];

    if (checked) {
      // Add all from group that aren't already selected
      groupPermissionIds.forEach((id) => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
    } else {
      // Remove all from group
      newSelected = newSelected.filter((id) => !groupPermissionIds.includes(id));
    }

    onSelectionChange(newSelected);
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    if (readOnly) return;

    if (checked) {
      onSelectionChange([...selectedPermissions, permissionId]);
    } else {
      onSelectionChange(selectedPermissions.filter((id) => id !== permissionId));
    }
  };

  const isGroupSelected = (groupName: string) => {
    const groupPermissions = groupedPermissions[groupName];
    if (!groupPermissions || groupPermissions.length === 0) return false;
    return groupPermissions.every((p) => selectedPermissions.includes(p.id));
  };

  const isGroupIndeterminate = (groupName: string) => {
    const groupPermissions = groupedPermissions[groupName];
    if (!groupPermissions || groupPermissions.length === 0) return false;
    const selectedCount = groupPermissions.filter((p) => selectedPermissions.includes(p.id)).length;
    return selectedCount > 0 && selectedCount < groupPermissions.length;
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari permission..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Accordion type="multiple" defaultValue={Object.keys(groupedPermissions)} className="w-full">
          {Object.entries(groupedPermissions).map(([group, items]) => (
            <AccordionItem key={group} value={group} className="px-4 border-b last:border-0">
              <div className="flex items-center py-4">
                {!readOnly && (
                  <Checkbox
                    id={`group-${group}`}
                    checked={isGroupSelected(group) || (isGroupIndeterminate(group) ? "indeterminate" : false)}
                    onCheckedChange={(checked) => handleGroupToggle(group, checked as boolean)}
                    className="mr-3"
                  />
                )}
                <AccordionTrigger className="hover:no-underline py-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{group}</span>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {items.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
              </div>
              
              <AccordionContent className="pb-4 pt-0 pl-7">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-start space-x-2 p-2 rounded-md hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        id={permission.id}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked as boolean)}
                        disabled={readOnly}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={permission.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {permission.name}
                        </Label>
                        {permission.description && (
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        
        {Object.keys(groupedPermissions).length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            Tidak ada permission yang ditemukan.
          </div>
        )}
      </div>
    </div>
  );
}
