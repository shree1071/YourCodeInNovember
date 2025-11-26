import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 px-4 py-16">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="rounded-2xl bg-white p-8 shadow-xl">
              <h1 className="mb-4 text-4xl font-bold text-gray-900">
                Protected Dashboard
              </h1>
              <p className="mb-6 text-lg text-gray-600">
                This page is only accessible to authenticated users.
              </p>

              {user && (
                <div className="space-y-4 rounded-lg bg-gray-50 p-6">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Welcome, {user.firstName || user.emailAddresses[0]?.emailAddress}!
                  </h2>
                  <div className="space-y-2 text-gray-700">
                    <p>
                      <strong>User ID:</strong> {user.id}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      {user.emailAddresses[0]?.emailAddress}
                    </p>
                    {user.firstName && (
                      <p>
                        <strong>Name:</strong> {user.firstName}{" "}
                        {user.lastName || ""}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-8">
                <Link
                  href="/"
                  className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl bg-white p-6 shadow-lg">
                <h3 className="mb-2 text-xl font-semibold text-gray-800">
                  Protected Route Example
                </h3>
                <p className="text-gray-600">
                  This dashboard demonstrates how to protect routes using
                  Clerk&apos;s <code className="rounded bg-gray-100 px-2 py-1 text-sm">&lt;SignedIn&gt;</code> component.
                </p>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-lg">
                <h3 className="mb-2 text-xl font-semibold text-gray-800">
                  Server-Side Auth
                </h3>
                <p className="text-gray-600">
                  User data is fetched server-side using{" "}
                  <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                    currentUser()
                  </code>{" "}
                  from <code className="rounded bg-gray-100 px-2 py-1 text-sm">@clerk/nextjs/server</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SignedIn>
    </>
  );
}

