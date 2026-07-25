'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  importSellerProductsCsv,
  type SellerCsvImportRowResult,
} from '@/lib/actions/seller.actions'
import {
  parseSellerProductCsv,
  sellerProductCsvTemplate,
} from '@/lib/csv/seller-product-import'

export default function SellerProductCsvImport() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [results, setResults] = useState<SellerCsvImportRowResult[]>([])
  const [parseErrors, setParseErrors] = useState<
    { rowNumber: number; message: string }[]
  >([])
  const [pending, startTransition] = useTransition()

  const preview = useMemo(() => {
    if (!csvText.trim()) return null
    return parseSellerProductCsv(csvText, { maxRows: 100 })
  }, [csvText])

  function onFile(fileList: FileList | null) {
    const file = fileList?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      setCsvText(String(reader.result || ''))
      setResults([])
      setParseErrors([])
    }
    reader.readAsText(file)
  }

  function downloadTemplate() {
    const blob = new Blob([sellerProductCsvTemplate()], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'seller-products-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function runImport(dryRun: boolean) {
    if (!csvText.trim()) {
      toast.error('Choose a CSV file first')
      return
    }
    startTransition(async () => {
      const result = await importSellerProductsCsv(csvText, { dryRun })
      setResults(result.results)
      setParseErrors(result.parseErrors)
      if (!result.success && result.created === 0) {
        toast.error(result.message)
        return
      }
      toast.success(result.message)
      if (!dryRun && result.created > 0) {
        router.refresh()
      }
    })
  }

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Hide CSV import' : 'Import CSV'}
        </Button>
      </div>

      {open ? (
        <div className='space-y-3 rounded-lg border p-4'>
          <div>
            <h3 className='font-semibold'>Import products from CSV</h3>
            <p className='text-sm text-muted-foreground'>
              Columns: name, price, listPrice, stock, category, description,
              imageUrl, tags, published (max 100 rows). Category matches id,
              slug, or name.
            </p>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={downloadTemplate}
            >
              Download template
            </Button>
            <label className='inline-flex cursor-pointer items-center rounded-md border px-3 py-1.5 text-sm hover:bg-muted'>
              Choose file
              <input
                type='file'
                accept='.csv,text/csv'
                className='hidden'
                onChange={(e) => onFile(e.target.files)}
              />
            </label>
            {fileName ? (
              <span className='text-sm text-muted-foreground'>{fileName}</span>
            ) : null}
          </div>

          {preview ? (
            <p className='text-sm text-muted-foreground'>
              Parsed {preview.rows.length} valid row
              {preview.rows.length === 1 ? '' : 's'}
              {preview.errors.length
                ? ` · ${preview.errors.length} parse issue(s)`
                : ''}
            </p>
          ) : null}

          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='outline'
              disabled={pending || !csvText.trim()}
              onClick={() => runImport(true)}
            >
              Dry run
            </Button>
            <Button
              type='button'
              disabled={pending || !csvText.trim()}
              onClick={() => runImport(false)}
            >
              Import
            </Button>
          </div>

          {parseErrors.length > 0 ? (
            <ul className='space-y-1 text-sm text-destructive'>
              {parseErrors.map((err) => (
                <li key={`parse-${err.rowNumber}-${err.message}`}>
                  {err.message}
                </li>
              ))}
            </ul>
          ) : null}

          {results.length > 0 ? (
            <div className='max-h-64 overflow-auto rounded border'>
              <table className='w-full text-left text-sm'>
                <thead className='bg-muted/50'>
                  <tr>
                    <th className='p-2'>Row</th>
                    <th className='p-2'>Name</th>
                    <th className='p-2'>Status</th>
                    <th className='p-2'>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row) => (
                    <tr
                      key={`${row.rowNumber}-${row.name}-${row.message}`}
                      className='border-t'
                    >
                      <td className='p-2'>{row.rowNumber}</td>
                      <td className='p-2'>{row.name || '—'}</td>
                      <td className='p-2'>{row.ok ? 'OK' : 'Error'}</td>
                      <td className='p-2 text-muted-foreground'>
                        {row.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
