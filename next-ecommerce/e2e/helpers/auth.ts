import { expect, type Page } from '@playwright/test'

export async function signIn(
  page: Page,
  email: string,
  password: string,
  callbackUrl = '/account'
) {
  await page.goto(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible({
    timeout: 30_000,
  })
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(
    (url) => !url.pathname.startsWith('/sign-in'),
    { timeout: 30_000 }
  )
}
