import axios from "axios";
import { NodeData, EdgeData } from "../../types"; // Import types as needed

// Function to create graph data from the graph object
export const createGraphData = (graph: any) => {
  const graphData: {
    nodes: NodeData[];
    edges: EdgeData[];
    core_indices: number[];
  } = {
    nodes: [],
    edges: [],
    core_indices: [],
  };

  let index = 0;
  graph.forEachNode((node: string, attributes: any) => {
    graphData.nodes.push({
      id: node,
      key: node,
      label: attributes.label,
      x: attributes.x,
      y: attributes.y,
      degree: attributes.degree,
      degree_centrality: attributes.degree_centrality,
      betweenness_centrality: attributes.betweenness_centrality,
      closeness_centrality: attributes.closeness_centrality,
      eigenvector_centrality: attributes.eigenvector_centrality,
      core_periphery: attributes.core_periphery,
      group: attributes.group,
      attributes: attributes.attributes || {},
    });
    if (attributes.core_periphery > 0.5) {
      graphData.core_indices.push(index);
    }
    index++;
  });

  graph.forEachEdge(
    (edge: string, attributes: any, source: string, target: string) => {
      graphData.edges.push({
        source,
        target,
        weight: attributes.weight !== undefined ? attributes.weight : 1,
        attributes: attributes.attributes || {},
      });
    }
  );

  return graphData;
};

// Function to update the metric and upload graph data
export const updateGraphMetric = async (graph: any, method: string | null) => {
  // Create graph data
  console.log("Sending Data:", { graph, method });
  // Upload graph data to the server
  const response = await axios.post(
    "http://localhost:8000/uploadCurrent/",
    { graph, method },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data.metric;
};

// Function to fetch the metric data from the server
export const fetchMetricData = async () => {
  const response = await axios.get("http://localhost:8000/graph/metric-json/");
  return response.data;
};
