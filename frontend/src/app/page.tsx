import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="flex max-w-lg flex-col items-center text-center">
        <h1 className="text-3xl font-semibold tracking-tight">SpendIT</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          Manage bills and subscriptions—each one is a row in{" "}
          <code className="rounded bg-neutral-200 px-1.5 py-0.5 text-sm font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
            SI_Items
          </code>
          .
        </p>
        <Link
          href="/app"
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white dark:focus-visible:outline-neutral-100"
        >
          Open app
        </Link>
      </div>
    </main>
  );
}
