import "../Styles/RoomCardSkeleton.css";

export default function RoomCardSkeleton() {
  return (
    <div className="roomCard skeleton">
      <div className="skeleton-image" />
      <div className="skeleton-content">
        <div className="skeleton-line title" />
        <div className="skeleton-line small" />
        <div className="skeleton-line small" />
        <div className="skeleton-line price" />
      </div>
    </div>
  );
}
