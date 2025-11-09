import API from "./axios";

/** Student: list my certificates */
export async function listMyCertificates() {
  const { data } = await API.get("/certificates/mine");
  return Array.isArray(data) ? data : [];
}

/** University: list certificates for a given university username */
export async function listCertificates(username) {
  const { data } = await API.get(`/certificates/${username}/list`);
  const rows = Array.isArray(data) ? data : [];
  return rows.map((c) => {
    const student = c.student && typeof c.student === "object" ? c.student : null;
    const studentName = c.studentName || student?.name || "—";
    const studentEmail = c.studentEmail || student?.email || "—";
    const sid = c.extras?.studentId || student?.studentId || "";
    return {
      ...c,
      studentName,
      studentEmail,
      extras: { ...(c.extras || {}), studentId: sid },
    };
  });
}

/** University: search students in-scope */
export async function searchStudentsForCertificates(username, q) {
  const { data } = await API.get(`/certificates/${username}/search-students`, { params: { q } });
  return Array.isArray(data) ? data : [];
}

/** University: issue certificate (studentKey can be ObjectId, 6-digit StudentID, or email) */
export async function issueCertificate(username, { studentKey, title, description, issueDate }) {
  const payload = { studentKey, title, description, issueDate };
  const { data } = await API.post(`/certificates/${username}/create`, payload);
  return data;
}

/** University: revoke certificate */
export async function revokeCertificate(_username, certId) {
  const { data } = await API.patch(`/certificates/${certId}/revoke`);
  return data;
}

/** University: un-revoke certificate */
export async function unrevokeCertificate(_username, certId) {
  const { data } = await API.patch(`/certificates/${certId}/unrevoke`);
  return data;
}

/** University: delete certificate */
export async function deleteCertificate(_username, certId) {
  const { data } = await API.delete(`/certificates/${certId}`);
  return data;
}

/** Public: verify a certificate hash */
export async function verifyPublicCertificate(hash) {
  const { data } = await API.get(`/certificates/public/${hash}`);
  return data;
}
