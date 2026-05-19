import DashboardLayout from "../../components/layout/DashboardLayout";

export default function Reports() {
  return (
    <DashboardLayout
      role="admin"
      title="Reports"
      subtitle="View platform reports and summaries."
    >
      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <h2>Reports</h2>
          </div>
        </div>

        <div className="empty-state">
          <span>↗</span>
          <h3>No reports yet</h3>
          <p>
            System summaries and platform reports will be displayed here.
          </p>
        </div>
      </section>
    </DashboardLayout>
  );
}