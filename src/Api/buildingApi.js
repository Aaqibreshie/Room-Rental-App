export const getMyBuildings = async (token) => {
  try {
    const res = await fetch(
      "http://localhost:5000/api/buildings/landlord/my-buildings",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const json = await res.json();
    return res.ok ? json.data : [];
  } catch (err) {
    console.error("Error fetching buildings:", err);
    return [];
  }
};
