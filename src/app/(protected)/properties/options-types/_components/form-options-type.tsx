"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */
export interface OptionType {
  id: string;
  category: "building" | "floor" | "room";
  name: string;
  description: string;
  metadata: any;
}

/* -------------------------------------------------------------------------- */
/* Dynamic Form Fields Configuration                                          */
/* -------------------------------------------------------------------------- */
const CATEGORY_FIELDS = {
  building: [
    { name: "floors", label: "Jumlah Lantai", type: "number", required: true },
    { name: "yearBuilt", label: "Tahun Dibangun", type: "number", required: false },
    { name: "capacity", label: "Kapasitas Total", type: "number", required: false },
    { name: "facilities", label: "Fasilitas", type: "array", required: false },
  ],
  floor: [
    { name: "level", label: "Tingkat/Level", type: "number", required: true },
    { name: "totalRooms", label: "Total Kamar", type: "number", required: false },
    { name: "hasElevatorAccess", label: "Akses Elevator", type: "boolean", required: false },
    { name: "commonAreas", label: "Area Umum", type: "array", required: false },
  ],
  room: [
    { name: "bedType", label: "Tipe Tempat Tidur", type: "text", required: true },
    { name: "maxOccupancy", label: "Kapasitas Maksimal", type: "number", required: true },
    { name: "priceMultiplier", label: "Pengali Harga", type: "number", required: false },
    { name: "amenities", label: "Amenitas", type: "array", required: false },
  ],
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */
export function FormOptionsType({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OptionType, id?: string) => void;
  initialData?: OptionType | null;
}) {
  const [category, setCategory] = useState<"building" | "floor" | "room">("building");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ---------------------------------------------------------------------- */
  /* Load initial data / reset on open/close                                */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCategory(initialData.category);
        setName(initialData.name);
        setDescription(initialData.description);
        setMetadata(initialData.metadata || {});
      } else {
        setCategory("building");
        setName("");
        setDescription("");
        setMetadata({});
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  /* ---------------------------------------------------------------------- */
  /* Handlers                                                               */
  /* ---------------------------------------------------------------------- */
  const handleCategoryChange = (value: string) => {
    setCategory(value as any);
    setMetadata({}); // Reset metadata when category changes
  };

  const handleMetadataChange = (fieldName: string, value: any) => {
    setMetadata((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleArrayAdd = (fieldName: string, value: string) => {
    if (!value.trim()) return;
    
    const currentArray = metadata[fieldName] || [];
    setMetadata((prev) => ({
      ...prev,
      [fieldName]: [...currentArray, value.trim()],
    }));
  };

  const handleArrayRemove = (fieldName: string, index: number) => {
    const currentArray = metadata[fieldName] || [];
    setMetadata((prev) => ({
      ...prev,
      [fieldName]: currentArray.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleSubmit = () => {
    // Validation
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Nama wajib diisi";
    } else if (name.trim().length < 2) {
      newErrors.name = "Nama minimal 2 karakter";
    }

    // Validate required metadata fields
    const fields = CATEGORY_FIELDS[category];
    fields.forEach((field) => {
      if (field.required) {
        const value = metadata[field.name];
        if (value === undefined || value === null || value === "") {
          newErrors[field.name] = `${field.label} wajib diisi`;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    // Clean up metadata (remove empty values)
    const cleanedMetadata = Object.entries(metadata).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    const finalData: OptionType = {
      id: initialData?.id || "",
      category,
      name: name.trim(),
      description: description.trim(),
      metadata: cleanedMetadata,
    };

    onSubmit(finalData, initialData?.id);
    onClose();
  };

  /* ---------------------------------------------------------------------- */
  /* Render Dynamic Field                                                   */
  /* ---------------------------------------------------------------------- */
  const renderField = (field: any) => {
    const value = metadata[field.name];
    const error = errors[field.name];

    switch (field.type) {
      case "text":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              value={value || ""}
              onChange={(e) => handleMetadataChange(field.name, e.target.value)}
              placeholder={`Masukkan ${field.label.toLowerCase()}`}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case "number":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={value || ""}
              onChange={(e) =>
                handleMetadataChange(
                  field.name,
                  e.target.value ? Number(e.target.value) : ""
                )
              }
              placeholder={`Masukkan ${field.label.toLowerCase()}`}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case "boolean":
        return (
          <div key={field.name} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.name}
                checked={value || false}
                onCheckedChange={(checked) =>
                  handleMetadataChange(field.name, checked)
                }
              />
              <Label htmlFor={field.name} className="cursor-pointer">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case "array":
        return (
          <ArrayField
            key={field.name}
            fieldName={field.name}
            label={field.label}
            required={field.required}
            values={value || []}
            onAdd={handleArrayAdd}
            onRemove={handleArrayRemove}
            error={error}
          />
        );

      default:
        return null;
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */
  const currentFields = CATEGORY_FIELDS[category];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl">
            {initialData ? "Edit Option Tipe" : "Tambah Option Tipe Baru"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 py-4 space-y-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Kategori <span className="text-destructive">*</span>
            </Label>
            <Select
              disabled={!!initialData}
              value={category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="building">🏢 Bangunan</SelectItem>
                <SelectItem value="floor">🏗️ Lantai</SelectItem>
                <SelectItem value="room">🚪 Kamar</SelectItem>
              </SelectContent>
            </Select>
            {initialData && (
              <p className="text-xs text-muted-foreground">
                Kategori tidak dapat diubah saat mengedit
              </p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nama <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Contoh: Dormitory A, VIP Suite, Ground Floor"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Deskripsi singkat tentang tipe ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Dynamic Metadata Fields */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Detail Metadata</h3>
              <span className="text-xs text-muted-foreground">
                Sesuai kategori {category === "building" ? "Bangunan" : category === "floor" ? "Lantai" : "Kamar"}
              </span>
            </div>
            
            <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
              {currentFields.map((field) => renderField(field))}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleSubmit}>
            {initialData ? "Perbarui" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Array Field Component                                                      */
/* -------------------------------------------------------------------------- */
function ArrayField({
  fieldName,
  label,
  required,
  values,
  onAdd,
  onRemove,
  error,
}: {
  fieldName: string;
  label: string;
  required: boolean;
  values: string[];
  onAdd: (fieldName: string, value: string) => void;
  onRemove: (fieldName: string, index: number) => void;
  error?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(fieldName, inputValue);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {/* Display current values */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-background rounded-md border">
          {values.map((item, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => onRemove(fieldName, index)}
                className="hover:bg-primary/20 rounded-sm p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input for new value */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Tambahkan ${label.toLowerCase()}...`}
        />
        <Button type="button" onClick={handleAdd} size="icon" variant="outline">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}