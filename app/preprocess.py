import networkx as nx
import numpy as np
import json
import plotly.graph_objects as go


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
def graph_node_edge(G, cp_index=None, cp_cluster=None, cp_node_metric=None):
    pos = nx.spring_layout(G)  # spring layout을 사용하여 노드 위치 계산

    if cp_index is None :
        cp_index = np.zeros(G.number_of_nodes())

    if cp_cluster is None :
        cp_cluster = np.zeros(G.number_of_nodes())

    if cp_node_metric is None :
        cp_node_metric = np.zeros(G.number_of_nodes())

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
            "core_periphery_score": float(cp_node_metric[list(G.nodes).index(n)]),
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
def graph_adjacency(G, cp_index, threshold=0.5):
    node_degrees = dict(G.degree())
    # Separate core and periphery nodes based on `cp_index` values
    core_nodes = [i for i, x in enumerate(cp_index) if x >= threshold]
    periphery_nodes = [i for i, x in enumerate(cp_index) if x < threshold]

    # Sort the core and periphery nodes by degree in descending order
    core_nodes_sorted = sorted(core_nodes, key=lambda n: node_degrees[list(G.nodes())[n]], reverse=True)
    periphery_nodes_sorted = sorted(periphery_nodes, key=lambda n: node_degrees[list(G.nodes())[n]], reverse=True)

    # Combined new order (core nodes first, then periphery nodes, both sorted by degree)
    new_order = core_nodes_sorted + periphery_nodes_sorted

    # Reorder the adjacency matrix according to the new order
    A = nx.to_numpy_array(G)
    adjacency_matrix = A[new_order, :][:, new_order]


    # Get the node labels based on the new order
    node_labels = [G.nodes[list(G.nodes())[node]]['label'] for node in new_order]

    # Custom colorscale: white for 0 (no connection), light blue for 1 (connection)
    colorscale = [
        [0, '#FFFFFF'],  # White color for 0 (no connection)
        [1, '#87CEEB']   # Light blue for 1 (connection)
    ]

    # Create the heatmap using Plotly
    fig = go.Figure(data=go.Heatmap(
        z=adjacency_matrix,        # Adjacency matrix
        zmin=0,                    # Set minimum value
        zmax=1,                    # Set maximum value to 1 (values >= 1 will be mapped to light blue)
        x=node_labels,             # X-axis labels (nodes)
        y=node_labels,             # Y-axis labels (nodes)
        colorscale=colorscale,     # Custom colorscale
        showscale=False            # Hide the color scale
    ))

    # Add boundary between core and periphery
    boundary_index = len(core_nodes_sorted)  # The index where the boundary is
    fig.add_shape(
        type="line",
        x0=boundary_index - 0.5, y0=-0.5,
        x1=boundary_index - 0.5, y1=len(new_order) - 0.5,
        line=dict(color="black", width=1)
    )
    fig.add_shape(
        type="line",
        x0=-0.5, y0=boundary_index - 0.5,
        x1=len(new_order) - 0.5, y1=boundary_index - 0.5,
        line=dict(color="black", width=1)
    )

    # Update layout to set the size to 300x300, remove margins, and tighten the layout
    fig.update_layout(
        autosize=False,
        width=300,  # Set width to 300 pixels
        height=300,  # Set height to 300 pixels
        margin=dict(l=0, r=0, t=30, b=30),  # Remove all margins around the plot
        xaxis=dict(
            showticklabels=False,   # Hide x-axis tick labels
            mirror=True,            # Add border around the plot
            linecolor='black',      # Border color
            linewidth=1,            # Border thickness
            showgrid=False,         # Hide gridlines
            constrain='domain'      # Constrain the plot to fill the domain (no extra space)
        ),
        yaxis=dict(
            showticklabels=False,   # Hide y-axis tick labels
            mirror=True,            # Add border around the plot
            linecolor='black',      # Border color
            linewidth=1,            # Border thickness
            showgrid=False,         # Hide gridlines
            autorange='reversed',   # Flip the y-axis
            scaleanchor='x',        # Match the scaling of x and y axes
            constrain='domain'      # Constrain the plot to fill the domain (no extra space)
        )
    )

    # Convert the Plotly figure to JSON
    graph_json = fig.to_json()
    return graph_json
