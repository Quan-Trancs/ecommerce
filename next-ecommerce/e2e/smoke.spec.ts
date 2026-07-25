import { test, expect } from '@playwright/test'
import { signIn } from './helpers/auth'

const buyerEmail = process.env.E2E_BUYER_EMAIL || 'buyer@example.com'
const buyerPassword = process.env.E2E_BUYER_PASSWORD || 'BuyerPass123!'
const supportEmail = process.env.E2E_SUPPORT_EMAIL || 'support@example.com'
const supportPassword =
  process.env.E2E_SUPPORT_PASSWORD || 'SupportPass123!'
const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@example.com'
const adminPassword = process.env.E2E_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD

test.describe('public smoke', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/./)
    await expect(page.locator('body')).toBeVisible()
  })

  test('search page loads', async ({ page }) => {
    await page.goto('/search')
    await expect(page.locator('body')).toBeVisible()
    await expect(page).not.toHaveURL(/sign-in/)
  })

  test('sign-in page shows credentials form', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page.getByText('Sign in', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })

  test('account redirects guests to sign-in', async ({ page }) => {
    await page.goto('/account')
    await expect(page).toHaveURL(/sign-in/)
  })
})

test.describe('auth smoke', () => {
  test('buyer can open account', async ({ page }) => {
    test.skip(
      process.env.E2E_SKIP_AUTH === '1',
      'E2E_SKIP_AUTH=1'
    )
    await signIn(page, buyerEmail, buyerPassword, '/account')
    await expect(page).toHaveURL(/\/account/)
    await expect(page.locator('body')).toContainText(/account|orders|profile/i)
  })

  test('support can open ticket queue', async ({ page }) => {
    test.skip(
      process.env.E2E_SKIP_AUTH === '1',
      'E2E_SKIP_AUTH=1'
    )
    await signIn(page, supportEmail, supportPassword, '/support/tickets')
    await expect(page).toHaveURL(/\/support\/tickets/)
    await expect(page.getByRole('heading', { name: /ticket queue/i })).toBeVisible()
  })

  test('admin can open KPI overview', async ({ page }) => {
    test.skip(
      process.env.E2E_SKIP_AUTH === '1' || !adminPassword,
      'Admin password not set (E2E_ADMIN_PASSWORD or ADMIN_PASSWORD)'
    )
    await signIn(page, adminEmail, adminPassword!, '/admin')
    await expect(page).toHaveURL(/\/admin/)
    await expect(
      page.getByRole('heading', { name: /platform overview/i })
    ).toBeVisible()
    await expect(page.getByText(/revenue/i).first()).toBeVisible()
  })
})
