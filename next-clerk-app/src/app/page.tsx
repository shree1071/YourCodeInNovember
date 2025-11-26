import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-16">
      <main className="w-full max-w-4xl space-y-12 text-center">
        <div className="space-y-6">
          <h1 className="text-5xl font-bold text-gray-900 sm:text-6xl">
            Welcome to Your App
          </h1>
          <p className="text-xl text-gray-600 sm:text-2xl">
            Built with Next.js App Router + Clerk Authentication
          </p>
        </div>

        <SignedOut>
          <div className="space-y-8 rounded-2xl bg-white p-12 shadow-xl">
            <h2 className="text-3xl font-semibold text-gray-800">
              Get Started
            </h2>
            <p className="text-lg text-gray-600">
              Sign in or create an account to access protected content and
              features.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <p className="text-sm text-gray-500">
                Use the Sign In / Sign Up buttons in the header above to get
                started.
              </p>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="space-y-8 rounded-2xl bg-white p-12 shadow-xl">
            <h2 className="text-3xl font-semibold text-gray-800">
              You&apos;re Signed In! 🎉
            </h2>
            <p className="text-lg text-gray-600">
              You now have access to protected pages and features.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/dashboard"
                className="rounded-lg bg-indigo-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </SignedIn>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-xl font-semibold text-gray-800">
              Next.js App Router
            </h3>
            <p className="text-gray-600">
              Modern React framework with server components and routing.
            </p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-xl font-semibold text-gray-800">
              Clerk Authentication
            </h3>
            <p className="text-gray-600">
              Secure user management with pre-built components.
            </p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-xl font-semibold text-gray-800">
              TypeScript
            </h3>
            <p className="text-gray-600">
              Type-safe development for better code quality.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
