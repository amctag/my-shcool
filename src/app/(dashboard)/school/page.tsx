import { PageHeader } from "@/components/dashboard/PageHeader";
import { fakeSchoolDetails } from "@/features/school/mocks/adminDashboard";

export default function SchoolPage() {
  const school = fakeSchoolDetails;

  return (
    <div>
      <PageHeader
        title="School details"
        description="Contact and about information for this school"
      />
      <article className="rounded-2xl border border-border bg-white p-6">
        <h2 className="text-xl font-semibold">{school.schoolName}</h2>
        <p className="mt-2 text-sm text-muted">{school.about}</p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted">Year</dt>
            <dd>{school.yearTitle}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Address</dt>
            <dd>{school.address}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Email</dt>
            <dd>{school.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Phone</dt>
            <dd>{school.phone}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Telephone</dt>
            <dd>{school.telephone}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Website</dt>
            <dd>{school.website}</dd>
          </div>
        </dl>
      </article>
    </div>
  );
}
