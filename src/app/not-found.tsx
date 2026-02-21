import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="mb-2 text-xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
