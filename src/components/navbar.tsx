import Link from 'next/link'
import { createClient } from '../../supabase/server'
import { Button } from './ui/button'
import { User, UserCircle } from 'lucide-react'
import UserProfile from './user-profile'

interface NavbarProps {
  showDashboard?: boolean;
  showAuth?: boolean;
}

export default async function Navbar({ showDashboard = true, showAuth = true }: NavbarProps) {
  const supabase = createClient()

  const { data: { user } } = await (await supabase).auth.getUser()

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-2">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" prefetch className="text-xl font-bold">
          Logo
        </Link>
        {showAuth && (
          <div className="flex gap-4 items-center">
            {user && showDashboard ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <Button>
                    Dashboard
                  </Button>
                </Link>
                <UserProfile />
              </>
            ) : user ? (
              <UserProfile />
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
