import { useNavigate } from "react-router-dom";
import { getMyBuildings } from "../Api/buildingApi";

export const useListRoomRedirect = () => {
  const navigate = useNavigate();

  const handleListRoom = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return navigate("/login");
    }

    const buildings = await getMyBuildings(token);

    if (!buildings || buildings.length === 0) {
      // No building → redirect to create-building
      return navigate("/create-building");
    }

    // Building exists → redirect to create-room
    navigate("/create-room");
  };

  return { handleListRoom };
};
