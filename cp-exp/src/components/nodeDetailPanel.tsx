import React, { useState, useEffect } from "react";
import { Attributes } from "graphology-types";
import { useSigma } from "@react-sigma/core";

interface NodeDetailPanelProps {
  node: Attributes | null;
  onClose: () => void;
}

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({ node, onClose }) => {
  const [flipped, setFlipped] = useState(false);
  const [neighborCount, setNeighborCount] = useState(0);
  const sigma = useSigma();
  const graph = sigma.getGraph();

  useEffect(() => {
    setFlipped(false);
  }, [node]);

  if (!node) return null;

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const neighbors = graph
    .neighbors(node.label)
    .filter(
      (neighbor) => graph.getNodeAttribute(neighbor, "filter_hidden") === false
    );
  const sortedNeighbors = neighbors.sort((a, b) => a.localeCompare(b));

  const formattedSynopKeys = node.synop_keys
    ? node.synop_keys.split(", ").map((key: string) => `#${key}`)
    : [];

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    node.label
  )}`;

  let genreString = "";

  const genres = [
    { key: "genre_action", name: "Action" },
    { key: "genre_adventure", name: "Adventure" },
    { key: "genre_comedy", name: "Comedy" },
    { key: "genre_drama", name: "Drama" },
    { key: "genre_fantasy", name: "Fantasy" },
    { key: "genre_horror", name: "Horror" },
    { key: "genre_mystery", name: "Mystery" },
    { key: "genre_romance", name: "Romance" },
    { key: "genre_sf", name: "SF" },
    { key: "genre_sports", name: "Sports" },
    { key: "genre_suspense", name: "Suspense" },
  ];

  genreString = genres
    .filter((genre) => node[genre.key] === 1)
    .map((genre) => genre.name)
    .join(", ");

  let maxVal = 0;
  let maxGenreVal = 0;

  return (
    <div className="node-detail-panel">
      <button className="close-btn" onClick={onClose}>
        X
      </button>
      <div className={`card ${flipped ? "flipped" : ""}`} onClick={handleFlip}>
        <div className="card-inner">
          <div className="card-front">
            <img src={node.URL} alt={node.label} />
          </div>
          <div className="card-back">
            {
              <>
                <p className="synopsis">
                  <strong>Synopsis:</strong>
                </p>
                <p className="synopsis">{node.synopsis}</p>
              </>
            }
          </div>
        </div>
      </div>
      <h1 className="title-container">
        <a
          href={googleSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="title-link"
        >
          <div className="highlight"></div>
          <span>{node.label}</span>
        </a>
      </h1>
      {
        <>
          {formattedSynopKeys.length > 0 && (
            <div className="synop-keys">
              {formattedSynopKeys.map((key: string, index: number) => (
                <span key={index} className="synop-key">
                  {key}
                </span>
              ))}
            </div>
          )}
          {node.awarded === 1 && (
            <p className="awarded-message">
              <img
                src={node.image}
                alt="Awarded"
                style={{ width: "20px", verticalAlign: "middle" }}
              />
              <span style={{ marginLeft: "5px" }}>Awarded Animation</span>
            </p>
          )}
          <p>
            <strong>Studio:</strong> {node.studios}
          </p>
          <p>
            <strong>Year:</strong> {node.year}
          </p>
          <p>
            <strong>Genre:</strong> {genreString}
          </p>
          <p>
            <strong>Rating:</strong> {node.rating}
          </p>
          <p>
            <strong>Episodes:</strong> {Math.round(node.episodes)} (
            {node.duration})<br />
          </p>
        </>
      }
    </div>
  );
};

export default NodeDetailPanel;
