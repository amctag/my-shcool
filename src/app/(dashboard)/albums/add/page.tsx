import { BackLink } from "@/components/dashboard/BackLink";
import { AlbumForm } from "@/features/school/components/AlbumForm";

export default function AddAlbumPage() {
  return (
    <div className="space-y-4">
      <BackLink
        href="/albums"
      >
        Back to albums
      </BackLink>
      <AlbumForm />
    </div>
  );
}
