// src/api/collab.js
import API from "./axios";

/** List collaborations with pagination */
export const listCollabs = async ({ page = 1, pageSize = 10, q = "" } = {}) => {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("pageSize", pageSize);
  if (q) params.append("q", q);
  const { data } = await API.get(`/collab/list?${params.toString()}`);
  // Defensive shapes:
  return {
    items: Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []),
    total: Number(data?.total ?? (Array.isArray(data) ? data.length : 0)),
    page: Number(data?.page ?? page),
    pageSize: Number(data?.pageSize ?? pageSize),
  };
};

/** Start a collaboration (unified company/university) */
export const startCollab = async (payload) => {
  const { data } = await API.post("/collab/start", payload);
  return data;
};

/** Get one collaboration */
export const getCollab = async (id) => {
  const { data } = await API.get(`/collab/${id}`);
  return data;
};

/** Patch collaboration meta / MoU / stage / board */
export const patchCollab = async (id, patch) => {
  const { data } = await API.patch(`/collab/${id}`, patch);
  return data;
};

/** Tasks */
export const addTask = async (id, body) => {
  const { data } = await API.post(`/collab/${id}/tasks`, body);
  return data;
};
export const updateTask = async (id, taskId, body) => {
  const { data } = await API.patch(`/collab/${id}/tasks/${taskId}`, body);
  return data;
};

/** Messages */
export const sendMessage = async (id, body) => {
  const { data } = await API.post(`/collab/${id}/messages`, body);
  return data;
};
