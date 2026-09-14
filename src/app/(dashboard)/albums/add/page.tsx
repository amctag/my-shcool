import Link from "next/link";
import { AlbumForm } from "@/features/school/components/AlbumForm";

export default function AddAlbumPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/albums"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to albums
      </Link>
      <AlbumForm />
    </div>
  );
}
