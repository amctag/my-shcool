import Link from "next/link";
import { AlbumForm } from "@/features/school/components/AlbumForm";

export default async function EditAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const albumId = Number(id);

  return (
    <div className="space-y-4">
      <Link
        href="/albums"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to albums
      </Link>
      {Number.isInteger(albumId) && albumId > 0 ? (
        <AlbumForm albumId={albumId} />
      ) : (
        <p className="text-sm text-red-600">Invalid album id.</p>
      )}
    </div>
  );
}
