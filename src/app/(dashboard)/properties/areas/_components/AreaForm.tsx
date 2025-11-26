'use client'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'

export type Area = { id: string; code: string; name: string; lat?: string; lon?: string; timezone?: string }

export default function AreaForm({ initial, onSubmit, onReset }: { initial?: Area; onSubmit: (a: Area) => void; onReset: () => void }) {
  const [form, setForm] = useState<Area>({ id: '', code: '', name: '', lat: '', lon: '', timezone: 'Asia/Jakarta' })
  useEffect(() => {
    setForm(initial ?? { id: '', code: '', name: '', lat: '', lon: '', timezone: 'Asia/Jakarta' })
  }, [initial])
  function handleSave() {
    if (!form.code || !form.name) return
    onSubmit({ ...form, id: form.id || Math.random().toString(36).slice(2) })
  }
  return (
    <div className="space-y-3">
      <Input placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
      <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Latitude" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
        <Input placeholder="Longitude" value={form.lon} onChange={(e) => setForm({ ...form, lon: e.target.value })} />
      </div>
      <Input placeholder="Timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
      <div className="flex gap-3">
        <button className={buttonVariants({ variant: 'default' })} onClick={handleSave}>Save</button>
        <button className={buttonVariants({ variant: 'outline' })} onClick={onReset}>Reset</button>
      </div>
    </div>
  )
}

