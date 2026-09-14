import { PageHeader } from "@/components/dashboard/PageHeader";
import { AlbumsList } from "@/features/school/components/AlbumsList";

export default function AlbumsPage() {
  return (
    <div>
      <PageHeader title="Albums" description="School photo albums" />
      <AlbumsList />
    </div>
  );
}
