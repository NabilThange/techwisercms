"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import AddProductForm from "@/components/products/add-product-form"
import { ImportWizard } from "@/components/products/import-wizard"

export default function QuickActionsCMS() {
  const [openAdd, setOpenAdd] = useState(false)
  const [openImport, setOpenImport] = useState(false)

  return (
    <section className="grid gap-3 sm:gap-4 md:gap-6">
      <Card className="p-3 sm:p-4 md:p-6 flex flex-wrap items-center gap-2 sm:gap-3">
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild>
            <Button size="sm" className="min-w-36">
              Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[92vw] sm:w-auto sm:max-w-xl lg:max-w-2xl xl:max-w-3xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>Fill in the details and publish or save as draft.</DialogDescription>
            </DialogHeader>
            <AddProductForm onSubmitted={() => setOpenAdd(false)} />
          </DialogContent>
        </Dialog>

        <ImportWizard open={openImport} onOpenChange={setOpenImport} onCompleted={() => setOpenImport(false)} />

        <Button size="sm" variant="secondary" className="min-w-36" onClick={() => setOpenImport(true)}>
          Import from CSV
        </Button>

        <a href="/api/export/csv" className="ml-auto" aria-label="Export products to CSV">
          <Button size="sm" variant="outline">
            Export to CSV
          </Button>
        </a>
      </Card>
    </section>
  )
}
