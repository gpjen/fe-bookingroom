'use client'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import type { Area } from './AreaForm'

export default function AreaTable({ items, onEdit, onDelete }: { items: Area[]; onEdit: (a: Area) => void; onDelete: (id: string) => void }) {
  return (
    <div className="rounded-lg border bg-background">
      <div className="grid grid-cols-6 gap-2 p-3 text-sm font-medium">
        <span>No</span>
        <span>Code</span>
        <span>Name</span>
        <span>Latitude</span>
        <span>Longitude</span>
        <span className="text-right">Actions</span>
      </div>
      <Separator />
      {items.map((it, idx) => (
        <div key={it.id} className="grid grid-cols-6 gap-2 p-3 text-sm items-center">
          <span>{idx + 1}</span>
          <span>{it.code}</span>
          <span>{it.name}</span>
          <span>{it.lat}</span>
          <span>{it.lon}</span>
          <div className="flex justify-end gap-2">
            <button className={buttonVariants({ variant: 'outline' })} onClick={() => onEdit(it)}>Edit</button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className={buttonVariants({ variant: 'default' })}>Delete</button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Area</AlertDialogTitle>
                  <AlertDialogDescription>Are you sure you want to delete {it.name}?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(it.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  )
}

