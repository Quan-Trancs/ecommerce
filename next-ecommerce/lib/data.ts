import { IUserInput } from '@/types'
import bcrypt from 'bcryptjs'

const generateSecurePassword = () => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

const users: IUserInput[] = [
  {
    name: 'Admin User',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: bcrypt.hashSync(
      process.env.ADMIN_PASSWORD || generateSecurePassword(),
      5
    ),
    role: 'Admin',
    address: {
      fullName: 'Admin User',
      street: '123 Admin St',
      city: 'Admin City',
      province: 'AD',
      country: 'USA',
      postalCode: '12345',
      phoneNumber: '123-456-7890',
    },
    paymentMethod: 'Stripe',
    emailVerified: false,
  },
  {
    name: 'Test User',
    email: 'test@example.com',
    password: bcrypt.hashSync('TestPassword123!', 5),
    role: 'User',
    address: {
      fullName: 'Test User',
      street: '456 Test St',
      city: 'Test City',
      province: 'TS',
      country: 'USA',
      postalCode: '67890',
      phoneNumber: '234-567-8901',
    },
    paymentMethod: 'PayPal',
    emailVerified: false,
  },
]

const data = {
  users,
  headerMenus: [
    {
      name: "Today's Deals",
      href: '/search?tag=todays-deal',
    },
    {
      name: 'New Arrivals',
      href: '/search?tag=new-arrival',
    },
    {
      name: 'Featured',
      href: '/search?tag=featured',
    },
    {
      name: 'Best Sellers',
      href: '/search?tag=best-seller',
    },
    {
      name: 'All products',
      href: '/search',
    },
  ],
  carousels: [
    {
      title: 'Everything for everyday life',
      buttonCaption: 'Start shopping',
      image:
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2000&q=80',
      url: '/search',
      isPublished: true,
    },
    {
      title: 'Tech that just works',
      buttonCaption: 'Shop electronics',
      image:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=2000&q=80',
      url: '/search?category=electronics',
      isPublished: true,
    },
    {
      title: 'Fresh looks for the season',
      buttonCaption: 'Shop fashion',
      image:
        'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=2000&q=80',
      url: '/search?category=fashion',
      isPublished: true,
    },
  ],
}

export default data
