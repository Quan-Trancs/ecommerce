import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg'

declare global {
  // eslint-disable-next-line no-var
  var __storePgPool: Pool | undefined
}

function buildConnectionString() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const host = process.env.DB_HOST || 'localhost'
  const port = process.env.DB_PORT || '5432'
  const database = process.env.DB_NAME || 'store'
  const user = process.env.DB_USERNAME || 'store_user'
  const password = process.env.DB_PASSWORD || 'your_secure_password'
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`
}

export function getPool(): Pool {
  if (!global.__storePgPool) {
    global.__storePgPool = new Pool({
      connectionString: buildConnectionString(),
      max: 10,
    })
  }
  return global.__storePgPool
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params)
}

export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}
