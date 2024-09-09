import networkx as nx
import numpy as np
import json

def load_gexf_to_graph(gexf_file_path):
    graph = nx.read_gexf(gexf_file_path)
    return graph

# 그래프 요약 정보 생성 함수
def graph_overview(G):
    degree_centrality = nx.degree_centrality(G)
    betweenness_centrality = nx.betweenness_centrality(G, weight='weight')
    closeness_centrality = nx.closeness_centrality(G)
    eigenvector_centrality = nx.eigenvector_centrality(G, max_iter=100)
    degree = dict(G.degree())
    
    overview = {
        "node_count": G.number_of_nodes(),
        "edge_count": G.number_of_edges(),
        "average_degree": sum(degree.values()) / float(G.number_of_nodes()),
        "density": nx.density(G),
        "average_clustering_coefficient": nx.average_clustering(G),
        "average_shortest_path_length": nx.average_shortest_path_length(G) if nx.is_connected(G) else None,
        "degree_centrality_max": max(degree_centrality.values()),
        "degree_centrality_avg": sum(degree_centrality.values()) / len(degree_centrality),
        "betweenness_centrality_max": max(betweenness_centrality.values()),
        "betweenness_centrality_avg": sum(betweenness_centrality.values()) / len(betweenness_centrality),
        "closeness_centrality_max": max(closeness_centrality.values()),
        "closeness_centrality_avg": sum(closeness_centrality.values()) / len(closeness_centrality),
        "eigenvector_centrality_max": max(eigenvector_centrality.values()),
        "eigenvector_centrality_avg": sum(eigenvector_centrality.values()) / len(eigenvector_centrality),
    }
    return overview

# 노드 및 엣지 데이터를 생성하는 함수
def graph_node_edge(G, cp_index=None, cp_cluster=None):
    pos = nx.spring_layout(G)  # spring layout을 사용하여 노드 위치 계산

    if cp_index is None :
        cp_index = np.zeros(G.number_of_nodes())

    if cp_cluster is None :
        cp_cluster = np.zeros(G.number_of_nodes())

    degree_centrality = nx.degree_centrality(G)
    betweenness_centrality = nx.betweenness_centrality(G, weight='weight')
    closeness_centrality = nx.closeness_centrality(G)
    eigenvector_centrality = nx.eigenvector_centrality(G, max_iter=100)
    degree = dict(G.degree())

    nodes = [
        {
            "id": n,
            "key": n,
            "label": data.get('label', n),
            "x": pos[n][0],
            "y": pos[n][1],
            "degree": degree[n],
            "degree_centrality": degree_centrality[n],
            "betweenness_centrality": betweenness_centrality[n],
            "closeness_centrality": closeness_centrality[n],
            "eigenvector_centrality": eigenvector_centrality[n],
            "core_periphery": float(cp_index[list(G.nodes).index(n)]),
            "group": cp_cluster[list(G.nodes).index(n)],
            "attributes": data,
        }
        for n, data in G.nodes(data=True)
    ]

    edges = [
        {
            "source": u,
            "target": v,
            "weight": data.get("weight", 1.0),
            "attributes": data
        }
        for u, v, data in G.edges(data=True)
    ]

    return {"nodes": nodes, "edges": edges}

# 인접 행렬 생성 함수
def graph_adjacency(G, cp_index):
    # Identify core and periphery nodes based on cp_index
    core_nodes = [i for i, x in enumerate(cp_index) if x >= 0.5]
    periphery_nodes = [i for i, x in enumerate(cp_index) if x < 0.5]

    core = [1 for i,x in enumerate(cp_index) if x >= 0.5]
    peri = [0 for i,x in enumerate(cp_index) if x < 0.5]
    # Combined new order
    new_order = core_nodes + periphery_nodes
    cp_ind = core + peri

    # Reorder the adjacency matrix
    A = nx.to_numpy_array(G)
    A_reordered = A[new_order, :][:, new_order]

    # Generate node labels, using 'label' attribute if it exists, otherwise the node ID
    nodes_ordered_labels = [
        G.nodes[i].get("label", i) for i in [list(G.nodes)[j] for j in new_order]
    ]

    # Convert the reordered adjacency matrix to a list of lists for JSON serialization
    A_reordered_list = A_reordered.tolist()

    # Combine node labels and adjacency matrix into a dictionary
    adj_info = {"nodes_labels": nodes_ordered_labels, "cp_ind": cp_ind, "adjacency": A_reordered_list}

    return adj_info
