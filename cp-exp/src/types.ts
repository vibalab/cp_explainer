import { types } from "util";

export interface NodeData {
  id: string;
  key: string;
  label: string;
  x: number;
  y: number;
  degree: number;
  degree_centrality: number;
  betweenness_centrality: number;
  closeness_centrality: number;
  eigenvector_centrality: number;
  core_periphery: number;
  group: number;
  attributes: Record<string, any>; // attributes는 임의의 형태로 올 수 있음
}

export interface EdgeData {
  source: string;
  target: string;
  weight: number;
  attributes: Record<string, any>; // attributes는 임의의 형태로 올 수 있음
}

export interface Dataset {
  nodes: NodeData[];
  edges: EdgeData[];
  overviews: Overview;
}

export interface Overview {
  node_count: number;
  edge_count: number;
  average_degree: number;
  density: number;
  average_clustering_coefficient: number;
  average_shortest_path_length: number | null;
  degree_centrality_max: number;
  degree_centrality_avg: number;
  betweenness_centrality_max: number;
  betweenness_centrality_avg: number;
  closeness_centrality_max: number;
  closeness_centrality_avg: number;
  eigenvector_centrality_max: number;
  eigenvector_centrality_avg: number;
}

export interface GraphAdjacency {
  nodes_labels: (string | number)[];
  cp_ind: number[];
  adjacency: number[][];
}
