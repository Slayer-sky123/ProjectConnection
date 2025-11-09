// src/api/university.js
import API from "../api/axios";

/* ------------ Registration (university-first) ------------ */
export const registerUniversity = (payload) =>
  API.post(`/university/register`, payload).then((r) => r.data);

/* ------------ Me ------------ */
export const getUniversityMe = () =>
  API.get(`/auth/me`).then((r) => r.data.user);

/* ------------ Profile ------------ */
export const getUniversityProfile = (username) =>
  API.get(`/university/profile/${username}`).then((r) => r.data);

export const saveUniversityProfile = (payload) =>
  API.post(`/university/profile`, payload).then((r) => r.data);

/* ------------ Overview (landing) ------------ */
export const getOverview = (username) =>
  API.get(`/university/${username}/overview`).then((r) => r.data);

/* ------------ Students + Meta ------------ */
export const getStudents = (username) =>
  API.get(`/university/${username}/students`).then((r) => r.data);

export const getStudentMeta = (username, studentId) =>
  API.get(`/university/${username}/students/${studentId}/meta`).then((r) => r.data);

export const saveStudentMeta = (username, studentId, body) =>
  API.post(`/university/${username}/students/${studentId}/meta`, body).then((r) => r.data);

/* ------------ Placements & Top students ------------ */
export const getPlacements = (username) =>
  API.get(`/university/${username}/placements`).then((r) => r.data);

export const getTopStudents = (username) =>
  API.get(`/university/${username}/top-students`).then((r) => r.data);

/* ------------ Collab / Validation / Webinars (light) ------------ */
export const getCollaborations = (username) =>
  API.get(`/university/${username}/collaborations`).then((r) => r.data);

export const createMou = (username, payload) =>
  API.post(`/university/${username}/collaborations`, payload).then((r) => r.data);

export const getValidationList = (username) =>
  API.get(`/university/${username}/validation/pending`).then((r) => r.data);

export const endorseSkill = (username, id) =>
  API.post(`/university/${username}/validation/${id}/endorse`).then((r) => r.data);

export const getAiRecommendations = (username) =>
  API.get(`/university/${username}/recommendations`).then((r) => r.data);

export const getWebinars = (username) =>
  API.get(`/university/${username}/webinars`).then((r) => r.data);

export const createWebinar = (username, payload) =>
  API.post(`/university/${username}/webinars`, payload).then((r) => r.data);

/* ------------ Advanced analytics + AI ------------ */
export const getAdvancedAnalytics = (username) =>
  API.get(`/university/${username}/advanced`).then((r) => r.data);

export const getAiOverview = (username) =>
  API.get(`/university/${username}/ai/overview`).then((r) => r.data);

/** New canonical name */
export const getPlacementPredictions = (username) =>
  API.get(`/university/${username}/ai/predict-placements`).then((r) => r.data);

/** Backward-compat alias (your code asked for getPredictivePlacements) */
export const getPredictivePlacements = getPlacementPredictions;
