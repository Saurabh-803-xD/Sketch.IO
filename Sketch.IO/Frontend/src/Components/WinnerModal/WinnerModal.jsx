// WinnerModal.js
import React from "react";
import "./winnerModal.css";

export default function WinnerModal({ show, winner, onClose }) {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>🎉 We Have a Winner! 🎉</h2>
        <p>Congratulations, <strong>{winner.userName}</strong>!</p>
        <button onClick={onClose} className="close">Close</button>
      </div>
    </div>
  );
}
