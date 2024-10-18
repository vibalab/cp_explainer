import networkx as nx
import numpy as np
import json
import plotly.graph_objects as go
from plotly.subplots import make_subplots


# GML 파일 로드
def load_gml_to_graph(gml_file_path):
    graph = nx.read_gml(gml_file_path)
    return graph

# GEXF 파일 로드
def load_gexf_to_graph(gexf_file_path):
    graph = nx.read_gexf(gexf_file_path)
    return graph

# GraphML 파일 로드
def load_graphml_to_graph(graphml_file_path):
    graph = nx.read_graphml(graphml_file_path)
    return graph

# Adjacency List 파일 로드
def load_adjlist_to_graph(adjlist_file_path):
    graph = nx.read_adjlist(adjlist_file_path)
    return graph

# Edge List 파일 로드
def load_edgelist_to_graph(edgelist_file_path):
    graph = nx.read_edgelist(edgelist_file_path)
    return graph

# Pajek 파일 로드
def load_pajek_to_graph(pajek_file_path):
    graph = nx.read_pajek(pajek_file_path)
    return graph

# YAML 파일 로드
def load_yaml_to_graph(yaml_file_path):
    graph = nx.read_yaml(yaml_file_path)
    return graph

# Graph6 파일 로드
def load_graph6_to_graph(graph6_file_path):
    graph = nx.read_graph6(graph6_file_path)
    return graph

# Sparse6 파일 로드
def load_sparse6_to_graph(sparse6_file_path):
    graph = nx.read_sparse6(sparse6_file_path)
    return graph

# Multiline Adjacency List 파일 로드
def load_multiline_adjlist_to_graph(multiline_adjlist_file_path):
    graph = nx.read_multiline_adjlist(multiline_adjlist_file_path)
    return graph

# Pickle 파일 로드
def load_gpickle_to_graph(gpickle_file_path):
    graph = nx.read_gpickle(gpickle_file_path)
    return graph

# JSON 파일 로드
def load_json_to_graph(json_file_path):
    with open(json_file_path, "r") as f:
        data = f.read()
    graph = nx.node_link_graph(data)
    return graph


# 그래프 요약 정보 생성 함수
def graph_overview(G):
    try:
        overview = {}

        # 멀티그래프인 경우 단일 그래프로 변환 (중복 엣지를 제거)
        if isinstance(G, nx.MultiGraph) or isinstance(G, nx.MultiDiGraph):
            G = nx.Graph(G)  # 멀티그래프를 단순 그래프로 변환

        # 방향 그래프인 경우 무방향 그래프로 변환
        if G.is_directed():
            G = G.to_undirected()  # 방향 그래프를 무방향 그래프로 변환

        # 노드 및 엣지 관련 정보
        overview["node_count"] = G.number_of_nodes()
        overview["edge_count"] = G.number_of_edges()
        degree = dict(G.degree())
        overview["average_degree"] = sum(degree.values()) / float(G.number_of_nodes())
        overview["density"] = nx.density(G)

        # 평균 군집 계수
        try:
            overview["average_clustering_coefficient"] = nx.average_clustering(G)
        except Exception as e:
            print(f"Error calculating average_clustering_coefficient: {e}")
            overview["average_clustering_coefficient"] = None

        # 평균 최단 경로 길이 (연결된 그래프만)
        try:
            if nx.is_connected(G):
                overview["average_shortest_path_length"] = nx.average_shortest_path_length(G)
            else:
                overview["average_shortest_path_length"] = None
        except Exception as e:
            print(f"Error calculating average_shortest_path_length: {e}")
            overview["average_shortest_path_length"] = None

        # Degree Centrality
        try:
            degree_centrality = nx.degree_centrality(G)
            overview["degree_centrality_max"] = max(degree_centrality.values())
            overview["degree_centrality_avg"] = sum(degree_centrality.values()) / len(degree_centrality)
        except Exception as e:
            print(f"Error calculating degree_centrality: {e}")
            overview["degree_centrality_max"] = None
            overview["degree_centrality_avg"] = None

        # Betweenness Centrality
        try:
            betweenness_centrality = nx.betweenness_centrality(G, weight='weight')
            overview["betweenness_centrality_max"] = max(betweenness_centrality.values())
            overview["betweenness_centrality_avg"] = sum(betweenness_centrality.values()) / len(betweenness_centrality)
        except Exception as e:
            print(f"Error calculating betweenness_centrality: {e}")
            overview["betweenness_centrality_max"] = None
            overview["betweenness_centrality_avg"] = None

        # Closeness Centrality
        try:
            closeness_centrality = nx.closeness_centrality(G)
            overview["closeness_centrality_max"] = max(closeness_centrality.values())
            overview["closeness_centrality_avg"] = sum(closeness_centrality.values()) / len(closeness_centrality)
        except Exception as e:
            print(f"Error calculating closeness_centrality: {e}")
            overview["closeness_centrality_max"] = None
            overview["closeness_centrality_avg"] = None

        # Eigenvector Centrality (수렴 실패 시 처리)
        try:
            eigenvector_centrality = nx.eigenvector_centrality(G, max_iter=1000, tol=1e-4)
            overview["eigenvector_centrality_max"] = max(eigenvector_centrality.values())
            overview["eigenvector_centrality_avg"] = sum(eigenvector_centrality.values()) / len(eigenvector_centrality)
        except nx.PowerIterationFailedConvergence as e:
            print(f"Eigenvector centrality did not converge: {e}")
            overview["eigenvector_centrality_max"] = None
            overview["eigenvector_centrality_avg"] = None
        except Exception as e:
            print(f"Error calculating eigenvector_centrality: {e}")
            overview["eigenvector_centrality_max"] = None
            overview["eigenvector_centrality_avg"] = None

        return overview

    except Exception as e:
        # 최종적으로 다른 예외 발생 시 디버깅 메시지 출력
        error_message = f"Unexpected error occurred: {str(e)}"
        print(error_message)
        raise Exception(error_message)

# 노드 및 엣지 데이터를 생성하는 함수
def graph_node_edge(G, cp_index=None, cp_cluster=None, cp_node_metric=None):
    # 멀티그래프인 경우 단일 그래프로 변환 (중복 엣지 제거)
    if isinstance(G, nx.MultiGraph) or isinstance(G, nx.MultiDiGraph):
        G = nx.Graph(G)  # 멀티그래프를 단일 그래프로 변환

    # 방향 그래프인 경우 무방향 그래프로 변환
    if G.is_directed():
        G = G.to_undirected()  # 방향 그래프를 무방향 그래프로 변환

    pos = nx.spring_layout(G)  # spring layout을 사용하여 노드 위치 계산

    # None인 경우 기본값 설정
    if cp_index is None:
        cp_index = np.zeros(G.number_of_nodes())

    if cp_cluster is None:
        cp_cluster = np.zeros(G.number_of_nodes())

    if cp_node_metric is None:
        cp_node_metric = np.zeros(G.number_of_nodes())

    # Degree Centrality
    try:
        degree_centrality = nx.degree_centrality(G)
    except Exception as e:
        print(f"Error calculating degree_centrality: {e}")
        degree_centrality = {n: None for n in G.nodes()}

    # Betweenness Centrality
    try:
        betweenness_centrality = nx.betweenness_centrality(G, weight='weight')
    except Exception as e:
        print(f"Error calculating betweenness_centrality: {e}")
        betweenness_centrality = {n: None for n in G.nodes()}

    # Closeness Centrality
    try:
        closeness_centrality = nx.closeness_centrality(G)
    except Exception as e:
        print(f"Error calculating closeness_centrality: {e}")
        closeness_centrality = {n: None for n in G.nodes()}

    # Eigenvector Centrality
    try:
        eigenvector_centrality = nx.eigenvector_centrality(G, max_iter=1000, tol=1e-4)
    except nx.PowerIterationFailedConvergence as e:
        print(f"Eigenvector centrality did not converge: {e}")
        eigenvector_centrality = {n: None for n in G.nodes()}
    except Exception as e:
        print(f"Error calculating eigenvector_centrality: {e}")
        eigenvector_centrality = {n: None for n in G.nodes()}

    # Degree 정보
    degree = dict(G.degree())

    # 노드 데이터 생성
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

    # 엣지 데이터 생성
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
    try:
        # 노드의 차수 계산
        node_degrees = dict(G.degree())
        
        # Core와 Periphery 노드 분리
        core_nodes = [i for i, x in enumerate(cp_index) if x >= threshold]
        periphery_nodes = [i for i, x in enumerate(cp_index) if x < threshold]

        # Core와 Periphery 노드를 차수에 따라 정렬
        core_nodes_sorted = sorted(core_nodes, key=lambda n: node_degrees[list(G.nodes())[n]], reverse=True)
        periphery_nodes_sorted = sorted(periphery_nodes, key=lambda n: node_degrees[list(G.nodes())[n]], reverse=True)

        # Core 노드를 먼저, 그 후 Periphery 노드를 포함한 새로운 순서
        new_order = core_nodes_sorted + periphery_nodes_sorted

        # 새로운 순서에 따른 인접 행렬 재배열
        A = nx.to_numpy_array(G)
        adjacency_matrix = A[new_order, :][:, new_order]

        # 새로운 순서에 따른 노드 레이블 가져오기
        node_labels = [G.nodes[list(G.nodes())[node]].get('label', f"Node {node}") for node in new_order]

        # Custom colorscale: white for 0 (no connection), light blue for 1 (connection)
        colorscale = [
            [0, '#FFFFFF'],  # White color for 0 (no connection)
            [1, '#87CEEB']   # Light blue for 1 (connection)
        ]

        # Heatmap 생성
        fig = go.Figure(data=go.Heatmap(
            z=adjacency_matrix,        # 인접 행렬
            zmin=0,                    # 최소값 설정
            zmax=1,                    # 최대값 1로 설정
            x=node_labels,             # X축 레이블 (노드들)
            y=node_labels,             # Y축 레이블 (노드들)
            colorscale=colorscale,     # 커스텀 컬러스케일
            showscale=False            # 색상 눈금 표시 안함
        ))

        # Core와 Periphery 사이 경계선 추가
        boundary_index = len(core_nodes_sorted)  # 경계선 인덱스
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

        # 레이아웃 업데이트 (크기, 축 제거 등)
        fig.update_layout(
            autosize=False,
            width=300,  # 너비 설정
            height=300,  # 높이 설정
            margin=dict(l=0, r=0, t=30, b=30),  # 마진 제거
            xaxis=dict(
                showticklabels=False,   # X축 레이블 숨김
                mirror=True,            # 플롯 주변 경계선
                linecolor='black',      # 경계선 색상
                linewidth=1,            # 경계선 두께
                showgrid=False,         # 그리드라인 숨김
                constrain='domain'      # 여분 공간 없음
            ),
            yaxis=dict(
                showticklabels=False,   # Y축 레이블 숨김
                mirror=True,            # 플롯 주변 경계선
                linecolor='black',      # 경계선 색상
                linewidth=1,            # 경계선 두께
                showgrid=False,         # 그리드라인 숨김
                autorange='reversed',   # Y축 뒤집기
                scaleanchor='x',        # X축과 Y축의 비율 고정
                constrain='domain'      # 여분 공간 없음
            )
        )

        # Plotly 도형을 JSON으로 변환
        graph_json = fig.to_json()
        return graph_json

    except Exception as e:
        # 예외가 발생하면 디버깅용으로 예외 메시지 반환
        error_message = f"Error occurred: {str(e)}"
        raise Exception(error_message)


def create_core_periphery_boxplots(core_nodes, periphery_nodes):
        # Extract closeness centrality for core and periphery nodes
    core_closeness = [node['closeness_centrality'] for node in core_nodes]
    periphery_closeness = [node['closeness_centrality'] for node in periphery_nodes]

    # Calculate the overall average closeness centrality
    all_closeness = core_closeness + periphery_closeness
    overall_avg = sum(all_closeness) / len(all_closeness) if all_closeness else 0

    # Create a boxplot figure for closeness centrality comparison
    fig = go.Figure()

    # Closeness Centrality Boxplot for Core
    fig.add_trace(
        go.Box(
            y=core_closeness,
            name="Core",
            marker_color='#87CEEB',  # Light blue fill for Core group
        )
    )

    # Closeness Centrality Boxplot for Periphery with white fill and gray outline
    fig.add_trace(
        go.Box(
            y=periphery_closeness,
            name="Periphery",
            marker=dict(
                color='#CFD4DA',  # Outline color
                line=dict(color='#CFD4DA')  # Set the outline color
            ),
            fillcolor='#FFFFFF'  # White fill for the Periphery group
        )
    )

    # Add a horizontal dashed line for the overall average closeness centrality
    fig.add_shape(
        type="line",
        x0=-0.5,  # Start the line from the left of the first boxplot
        x1=1.5,  # Extend the line to the right of the second boxplot
        y0=overall_avg,  # The y position is the overall average
        y1=overall_avg,
        line=dict(
            color="#CFD4DA",  # You can change the color if needed
            width=2,
            dash="dash",  # Set the line to be dashed
        )
    )
    # Update layout
    fig.update_layout(
        showlegend=False,
        width=300,  # Set width to 400 pixels
        height=300,  # Set height to 400 pixels
        margin=dict(l=0, r=0, t=30, b=30),  # Remove all margins around the plot
    )

    # Convert the figure to JSON format

    graph_json = fig.to_json()
    return graph_json