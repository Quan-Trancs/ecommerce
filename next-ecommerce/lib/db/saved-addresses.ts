import { query, withClient } from '@/lib/db/postgres'
import type { ShippingAddress } from '@/types'

export type SavedAddress = {
  id: number
  accountId: string
  label: string | null
  fullName: string
  street: string
  city: string
  province: string
  postalCode: string
  country: string
  phone: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

type Row = {
  id: number | string
  account_id: string
  label: string | null
  full_name: string
  street: string
  city: string
  province: string
  postal_code: string
  country: string
  phone: string
  is_default: boolean
  created_at: Date | string
  updated_at: Date | string
}

function mapRow(row: Row): SavedAddress {
  return {
    id: Number(row.id),
    accountId: row.account_id,
    label: row.label,
    fullName: row.full_name,
    street: row.street,
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,
    country: row.country,
    phone: row.phone,
    isDefault: Boolean(row.is_default),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function listSavedAddresses(
  accountId: string
): Promise<SavedAddress[]> {
  const result = await query<Row>(
    `SELECT *
     FROM saved_addresses
     WHERE account_id = $1
     ORDER BY is_default DESC, updated_at DESC`,
    [accountId]
  )
  return result.rows.map(mapRow)
}

export async function getSavedAddress(
  accountId: string,
  id: number
): Promise<SavedAddress | null> {
  const result = await query<Row>(
    `SELECT * FROM saved_addresses WHERE account_id = $1 AND id = $2 LIMIT 1`,
    [accountId, id]
  )
  return result.rows[0] ? mapRow(result.rows[0]) : null
}

export async function createSavedAddress(input: {
  accountId: string
  label?: string | null
  address: ShippingAddress
  isDefault?: boolean
}): Promise<SavedAddress> {
  return withClient(async (client) => {
    await client.query('BEGIN')
    try {
      const makeDefault = Boolean(input.isDefault)
      if (makeDefault) {
        await client.query(
          `UPDATE saved_addresses SET is_default = FALSE, updated_at = NOW()
           WHERE account_id = $1`,
          [input.accountId]
        )
      }
      const existingCount = await client.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM saved_addresses WHERE account_id = $1`,
        [input.accountId]
      )
      const isFirst = Number(existingCount.rows[0]?.count || 0) === 0
      const isDefault = makeDefault || isFirst

      const inserted = await client.query<Row>(
        `INSERT INTO saved_addresses
           (account_id, label, full_name, street, city, province, postal_code, country, phone, is_default, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         RETURNING *`,
        [
          input.accountId,
          input.label?.trim()?.slice(0, 80) || null,
          input.address.fullName.trim(),
          input.address.street.trim(),
          input.address.city.trim(),
          input.address.province.trim(),
          input.address.postalCode.trim(),
          input.address.country.trim(),
          input.address.phone.trim(),
          isDefault,
        ]
      )
      await client.query('COMMIT')
      return mapRow(inserted.rows[0])
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })
}

export async function updateSavedAddress(input: {
  accountId: string
  id: number
  label?: string | null
  address: ShippingAddress
  isDefault?: boolean
}): Promise<SavedAddress | null> {
  return withClient(async (client) => {
    await client.query('BEGIN')
    try {
      if (input.isDefault) {
        await client.query(
          `UPDATE saved_addresses SET is_default = FALSE, updated_at = NOW()
           WHERE account_id = $1`,
          [input.accountId]
        )
      }
      const updated = await client.query<Row>(
        `UPDATE saved_addresses
         SET label = $3,
             full_name = $4,
             street = $5,
             city = $6,
             province = $7,
             postal_code = $8,
             country = $9,
             phone = $10,
             is_default = CASE WHEN $11 THEN TRUE ELSE is_default END,
             updated_at = NOW()
         WHERE account_id = $1 AND id = $2
         RETURNING *`,
        [
          input.accountId,
          input.id,
          input.label?.trim()?.slice(0, 80) || null,
          input.address.fullName.trim(),
          input.address.street.trim(),
          input.address.city.trim(),
          input.address.province.trim(),
          input.address.postalCode.trim(),
          input.address.country.trim(),
          input.address.phone.trim(),
          Boolean(input.isDefault),
        ]
      )
      await client.query('COMMIT')
      return updated.rows[0] ? mapRow(updated.rows[0]) : null
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })
}

export async function deleteSavedAddress(
  accountId: string,
  id: number
): Promise<boolean> {
  const result = await query(
    `DELETE FROM saved_addresses WHERE account_id = $1 AND id = $2`,
    [accountId, id]
  )
  return (result.rowCount || 0) > 0
}

export async function setDefaultSavedAddress(
  accountId: string,
  id: number
): Promise<boolean> {
  return withClient(async (client) => {
    await client.query('BEGIN')
    try {
      const owned = await client.query(
        `SELECT 1 FROM saved_addresses WHERE account_id = $1 AND id = $2`,
        [accountId, id]
      )
      if (!owned.rows[0]) {
        await client.query('ROLLBACK')
        return false
      }
      await client.query(
        `UPDATE saved_addresses SET is_default = FALSE, updated_at = NOW()
         WHERE account_id = $1`,
        [accountId]
      )
      await client.query(
        `UPDATE saved_addresses SET is_default = TRUE, updated_at = NOW()
         WHERE account_id = $1 AND id = $2`,
        [accountId, id]
      )
      await client.query('COMMIT')
      return true
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })
}
