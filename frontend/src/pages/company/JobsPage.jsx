import JobsTab from "../../components/company/Jobs";
export default function JobsPage(props) {
  // Keep the entire logic/UI from your existing Jobs component.
  // Only wrapped as a Page for structure consistency.
  return <JobsTab {...props} />;
}
