import { PageHeader } from "@/components/dashboard/PageHeader";
import { fakeSchoolAlbums } from "@/features/school/mocks/adminDashboard";

export default function AlbumsPage() {
  return (
    <div>
      <PageHeader title="Albums" description="School photo albums" />
      <div className="grid gap-4 md:grid-cols-2">
        {fakeSchoolAlbums.map((album) => (
          <article key={album.id} className="rounded-2xl border border-border bg-white p-6">
            <div className="mb-4 flex h-36 items-center justify-center rounded-xl bg-primary-soft text-sm font-medium text-primary">
              {album.photos} photos
            </div>
            <h2 className="text-lg font-semibold">{album.title}</h2>
            <p className="mt-1 text-sm text-muted">{album.date}</p>
            <p className="mt-3 text-sm">{album.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
