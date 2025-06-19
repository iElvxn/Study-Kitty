const BASE_URL = "https://z7pfhq35c7.execute-api.us-east-1.amazonaws.com/production/";

export const apiRequest = async <T>(
  endpoint: string,
  method: string,
  token: string,
  body?: any
): Promise<T> => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "API Error");
  }

  return res.json();
};
