import { BackLink } from "@/components/dashboard/BackLink";
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
      <BackLink
        href="/albums"
      >
        Back to albums
      </BackLink>
      {Number.isInteger(albumId) && albumId > 0 ? (
        <AlbumForm albumId={albumId} />
      ) : (
        <p className="text-sm text-red-600">Invalid album id.</p>
      )}
    </div>
  );
}
