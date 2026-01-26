import { ApiError } from "../../utils/ApiError.js";

const allowed = {
  REPORTED: ["TRIAGED"],
  TRIAGED: ["ASSIGNED", "CLOSED"],
  ASSIGNED: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["RESOLVED", "CLOSED"],
  RESOLVED: ["VERIFIED", "IN_PROGRESS"],
  VERIFIED: ["CLOSED"],
  CLOSED: []
};

export const assertTransition = (from, to) => {
  if (!allowed[from]?.includes(to)) {
    throw new ApiError(400, `Invalid status transition: ${from} -> ${to}`);
  }
};
