from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os
import preprocess
import numpy as np
import json
from typing import Optional,  List, Dict, Any
from pydantic import BaseModel
import networkx as nx
import traceback
import logging
from algorithms.borgatti_everett import Borgatti_Everett
from algorithms.rossa import Rossa
from algorithms.brusco import Brusco
from algorithms.holme import Holme
from algorithms.lip import Lip
from algorithms.low_rank_core import Low_Rank_Core
from algorithms.minre import Minre
from algorithms.rombach import Rombach
from algorithms.silva import Silva

from algorithms.km_config import KM_Config
from algorithms.km_er import KM_ER
from algorithms.icpa import ICPA


app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 앱이 실행되는 포트
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

stored_parameters = {}


class NodeData(BaseModel):
    id: str
    key: str
    label: str
    x: float
    y: float
    degree: int
    degree_centrality: float
    betweenness_centrality: float
    closeness_centrality: float
    eigenvector_centrality: float
    core_periphery: float
    core_periphery_score: float
    group: int
    attributes: Dict[str, Any]

class EdgeData(BaseModel):
    source: str
    target: str
    weight: float  # Ensure weight is a float
    attributes: Dict[str, Any]

class GraphData(BaseModel):
    nodes: List[NodeData]
    edges: List[EdgeData]
    core_indices: List[int]

class GraphWithMethod(BaseModel):
    graphData: GraphData
    method: str  # Ensure method is a string



class AlgorithmRequest(BaseModel):
    filename: str
    method: str
    parameters: Dict[str, str]

# 업로드된 파일을 저장할 디렉터리 설정
UPLOAD_DIR = Path("uploaded_files")
JSON_DIR = Path("json_outputs")
OVERVIEW_FILE = JSON_DIR / "overview.json"
NODEFILE = JSON_DIR / "node_edge.json"
ADJFILE = JSON_DIR / "adjacency.json"
METFILE = JSON_DIR / "metric.json"

# 디렉터리가 없으면 생성
if not UPLOAD_DIR.exists():
    UPLOAD_DIR.mkdir(parents=True)

if not JSON_DIR.exists():
    JSON_DIR.mkdir(parents=True)

# GEXF 파일 업로드 및 분석 처리
@app.post("/uploadfile/")
async def upload_file(file: UploadFile):
    try:
        data = await file.read()
        save_to = UPLOAD_DIR / file.filename

        with open(save_to, "wb") as f:
            f.write(data)

        return JSONResponse(content={"message": "File uploaded successfully", "filename": file.filename})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 그래프 요약 정보 API
@app.get("/graph/overview/")
async def get_graph_overview(filename: str):
    try:
        file_location = UPLOAD_DIR / filename
        if not file_location.exists():
            raise HTTPException(status_code=404, detail="File not found")

        # 파일 확장자에 따라 다른 그래프 로딩 함수 호출
        if filename.endswith(".gexf") or filename.endswith(".gephi"):
            graph = preprocess.load_gexf_to_graph(str(file_location))
        elif filename.endswith(".gml"):
            graph = preprocess.load_gml_to_graph(str(file_location))
        elif filename.endswith(".graphml"):
            graph = preprocess.load_graphml_to_graph(str(file_location))
        elif filename.endswith(".adjlist"):
            graph = preprocess.load_adjlist_to_graph(str(file_location))
        elif filename.endswith(".edgelist"):
            graph = preprocess.load_edgelist_to_graph(str(file_location))
        elif filename.endswith(".net"):
            graph = preprocess.load_pajek_to_graph(str(file_location))
        elif filename.endswith(".yaml"):
            graph = preprocess.load_yaml_to_graph(str(file_location))
        elif filename.endswith(".graph6"):
            graph = preprocess.load_graph6_to_graph(str(file_location))
        elif filename.endswith(".sparse6"):
            graph = preprocess.load_sparse6_to_graph(str(file_location))
        elif filename.endswith(".gpickle"):
            graph = preprocess.load_gpickle_to_graph(str(file_location))
        elif filename.endswith(".json"):
            graph = preprocess.load_json_to_graph(str(file_location))
        elif filename.endswith(".xlsx") :
            graph = preprocess.load_excel_to_graph(str(file_location))
        elif filename.endswith(".csv") :
            graph = preprocess.load_csv_to_graph(str(file_location))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Supported formats are .gexf, .gml, .graphml, .adjlist, .edgelist, .net, .yaml, .graph6, .sparse6, .gpickle, and .json")

        overview = preprocess.graph_overview(graph)

        # JSON 파일로 저장
        output_file = JSON_DIR / f"overview.json"
        with open(output_file, "w") as f:
            json.dump(overview, f, indent=4)

        return JSONResponse(content={"message": "Graph overview saved successfully", "filepath": str(output_file)})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/graph/overview-json/")
async def get_graph_overview_json():
    if not OVERVIEW_FILE.exists():
        raise HTTPException(status_code=404, detail="Overview file not found")
    response = FileResponse(OVERVIEW_FILE, media_type="application/json")
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response



@app.get("/graph/metric-file/")
async def get_graph_metric_file():
    if not METFILE.exists():
        raise HTTPException(status_code=404, detail="Metric file not found")
    response = FileResponse(METFILE, media_type="application/json")
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response




# 그래프 노드 및 엣지 데이터 API
@app.get("/graph/node-edge/")
async def get_graph_node_edge(filename: str):
    try:
        file_location = UPLOAD_DIR / filename
        if not file_location.exists():
            raise HTTPException(status_code=404, detail="File not found")

        # 파일 확장자에 따라 다른 그래프 로딩 함수 호출
        if filename.endswith(".gexf") or filename.endswith(".gephi"):
            graph = preprocess.load_gexf_to_graph(str(file_location))
        elif filename.endswith(".gml"):
            graph = preprocess.load_gml_to_graph(str(file_location))
        elif filename.endswith(".graphml"):
            graph = preprocess.load_graphml_to_graph(str(file_location))
        elif filename.endswith(".adjlist"):
            graph = preprocess.load_adjlist_to_graph(str(file_location))
        elif filename.endswith(".edgelist"):
            graph = preprocess.load_edgelist_to_graph(str(file_location))
        elif filename.endswith(".net"):
            graph = preprocess.load_pajek_to_graph(str(file_location))
        elif filename.endswith(".yaml"):
            graph = preprocess.load_yaml_to_graph(str(file_location))
        elif filename.endswith(".graph6"):
            graph = preprocess.load_graph6_to_graph(str(file_location))
        elif filename.endswith(".sparse6"):
            graph = preprocess.load_sparse6_to_graph(str(file_location))
        elif filename.endswith(".gpickle"):
            graph = preprocess.load_gpickle_to_graph(str(file_location))
        elif filename.endswith(".json"):
            graph = preprocess.load_json_to_graph(str(file_location))
        elif filename.endswith(".xlsx") :
            graph = preprocess.load_excel_to_graph(str(file_location))
        elif filename.endswith(".csv") :
            graph = preprocess.load_csv_to_graph(str(file_location))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Supported formats are .gexf, .gml, .graphml, .adjlist, .edgelist, .net, .yaml, .graph6, .sparse6, .gpickle, and .json")

        node_edge_data = preprocess.graph_node_edge(graph)



        output_file = JSON_DIR / f"node_edge.json"
        with open(output_file, "w") as f:
            json.dump(node_edge_data, f, indent=4)

        return JSONResponse(content={"message": "Node edge data saved successfully", "filepath": str(output_file)})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/graph/node-edge-json/")
async def get_graph_node_edge_json():
    if not NODEFILE.exists():
        raise HTTPException(status_code=404, detail="Node Edge file not found")
    response = FileResponse(NODEFILE, media_type="application/json")
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


    
@app.get("/graph/adjacency-init/")
async def get_graph_adjacency_json(filename: str):
    try:
        file_location = UPLOAD_DIR / filename
        if not file_location.exists():
            raise HTTPException(status_code=404, detail="File not found")

        # 파일 확장자에 따라 다른 그래프 로딩 함수 호출
        if filename.endswith(".gexf") or filename.endswith(".gephi"):
            graph = preprocess.load_gexf_to_graph(str(file_location))
        elif filename.endswith(".gml"):
            graph = preprocess.load_gml_to_graph(str(file_location))
        elif filename.endswith(".graphml"):
            graph = preprocess.load_graphml_to_graph(str(file_location))
        elif filename.endswith(".adjlist"):
            graph = preprocess.load_adjlist_to_graph(str(file_location))
        elif filename.endswith(".edgelist"):
            graph = preprocess.load_edgelist_to_graph(str(file_location))
        elif filename.endswith(".net"):
            graph = preprocess.load_pajek_to_graph(str(file_location))
        elif filename.endswith(".yaml"):
            graph = preprocess.load_yaml_to_graph(str(file_location))
        elif filename.endswith(".graph6"):
            graph = preprocess.load_graph6_to_graph(str(file_location))
        elif filename.endswith(".sparse6"):
            graph = preprocess.load_sparse6_to_graph(str(file_location))
        elif filename.endswith(".gpickle"):
            graph = preprocess.load_gpickle_to_graph(str(file_location))
        elif filename.endswith(".json"):
            graph = preprocess.load_json_to_graph(str(file_location))
        elif filename.endswith(".xlsx") :
            graph = preprocess.load_excel_to_graph(str(file_location))
        elif filename.endswith(".csv") :
            graph = preprocess.load_csv_to_graph(str(file_location))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Supported formats are .gexf, .gml, .graphml, .adjlist, .edgelist, .net, .yaml, .graph6, .sparse6, .gpickle, and .json")

        cp_index = np.zeros(graph.number_of_nodes())

        graph_json = preprocess.graph_adjacency(G=graph, cp_index=cp_index)

        return JSONResponse(content=graph_json)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/graph/adjacency-update/")
async def get_graph_adjacency_update(request: dict):
    try:
        graph_data = request.get('graphData')  # 'graphData' 부분을 딕셔너리로 파싱
        threshold = request.get('threshold')  # 'threshold'도 마찬가지로 가져옴

        if not graph_data or threshold is None:
            raise ValueError("Invalid input data")

        # networkx 그래프 생성
        G = nx.Graph()
        core_index = []

        for node in graph_data['nodes']:
            G.add_node(
                node['id'],
                label=node['label'],
                degree=node['degree'],
                degree_centrality=node['degree_centrality'],
                betweenness_centrality=node['betweenness_centrality'],
                closeness_centrality=node['closeness_centrality'],
                eigenvector_centrality=node['eigenvector_centrality'],
                core_periphery=node['core_periphery'],
                attributes=node['attributes'],
                pos=(node['x'], node['y'])  # 노드의 좌표 추가
            )
            core_index.append(node['core_periphery'])

        # 엣지 추가
        for edge in graph_data['edges']:
            G.add_edge(
                edge['source'],
                edge['target'],
                weight=edge['weight'],
                attributes=edge['attributes']
            )

        # 그래프를 numpy 배열로 변환
        A = nx.to_numpy_array(G)
        n = A.shape[0]
        # 특정 전처리 함수 호출, 수정해야 할 수 있음
        graph_json = preprocess.graph_adjacency(G=G, cp_index=core_index, threshold=threshold)

        # JSON으로 응답 반환
        return JSONResponse(content=graph_json)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/graph/centrality_box/")
async def get_centrality_box(request: dict):
    try:
        # Assuming `graph_data` and `threshold` are already available from request
        graph_data = request.get('graphData')  # 'graphData' 부분을 딕셔너리로 파싱
        threshold = request.get('threshold')  # 'threshold'도 마찬가지로 가져옴

        if not graph_data or threshold is None:
            raise ValueError("Invalid input data")

        # Create networkx graph
        G = nx.Graph()

        # Separate core and periphery lists
        core_nodes = []
        periphery_nodes = []

        # Add nodes to the graph
        for node in graph_data['nodes']:
            G.add_node(
                node['id'],
                label=node['label'],
                degree=node['degree'],
                degree_centrality=node['degree_centrality'],
                betweenness_centrality=node['betweenness_centrality'],
                closeness_centrality=node['closeness_centrality'],
                eigenvector_centrality=node['eigenvector_centrality'],
                core_periphery=node['core_periphery'],
                core_periphery_score=node['core_periphery_score'],
                attributes=node['attributes'],
                pos=(node['x'], node['y'])  # Adding node coordinates
            )

            # Separate nodes into core and periphery groups based on the threshold
            if node['core_periphery'] >= threshold:
                core_nodes.append(node)
            else:
                periphery_nodes.append(node)

        # Add edges to the graph
        for edge in graph_data['edges']:
            G.add_edge(
                edge['source'],
                edge['target'],
                weight=edge['weight'],
                attributes=edge['attributes']
            )

        graph_json = preprocess.create_core_periphery_boxplots(core_nodes, periphery_nodes)

        # JSON으로 응답 반환
        return JSONResponse(content=graph_json)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/graph/algorithm")
async def apply_algorithm(
    filename: str,
    method: str,
    parameters: Optional[str] = None  # parameters는 선택적 파라미터로 설정
):
    try:
        # parameters가 존재할 경우 JSON 문자열을 딕셔너리로 변환
        if parameters:
            parameters_dict = json.loads(parameters)
            stored_parameters[filename] = parameters_dict
        else:
            parameters_dict = {}

        # 파일 위치 확인 및 처리
        file_location = UPLOAD_DIR / filename
        if not file_location.exists():
            raise HTTPException(status_code=404, detail="File not found")

        # 파일 확장자에 따라 다른 그래프 로딩 함수 호출

        # 파일 확장자에 따라 다른 그래프 로딩 함수 호출
        if filename.endswith(".gexf") or filename.endswith(".gephi"):
            graph = preprocess.load_gexf_to_graph(str(file_location))
        elif filename.endswith(".gml"):
            graph = preprocess.load_gml_to_graph(str(file_location))
        elif filename.endswith(".graphml"):
            graph = preprocess.load_graphml_to_graph(str(file_location))
        elif filename.endswith(".adjlist"):
            graph = preprocess.load_adjlist_to_graph(str(file_location))
        elif filename.endswith(".edgelist"):
            graph = preprocess.load_edgelist_to_graph(str(file_location))
        elif filename.endswith(".net"):
            graph = preprocess.load_pajek_to_graph(str(file_location))
        elif filename.endswith(".yaml"):
            graph = preprocess.load_yaml_to_graph(str(file_location))
        elif filename.endswith(".graph6"):
            graph = preprocess.load_graph6_to_graph(str(file_location))
        elif filename.endswith(".sparse6"):
            graph = preprocess.load_sparse6_to_graph(str(file_location))
        elif filename.endswith(".gpickle"):
            graph = preprocess.load_gpickle_to_graph(str(file_location))
        elif filename.endswith(".json"):
            graph = preprocess.load_json_to_graph(str(file_location))
        elif filename.endswith(".xlsx") :
            graph = preprocess.load_excel_to_graph(str(file_location))
        elif filename.endswith(".csv") :
            graph = preprocess.load_csv_to_graph(str(file_location))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Supported formats are .gexf, .gml, .graphml, .adjlist, .edgelist, .net, .yaml, .graph6, .sparse6, .gpickle, and .json")
        
        if isinstance(graph, nx.MultiGraph) or isinstance(graph, nx.MultiDiGraph):
            graph = nx.Graph(graph)  # 멀티그래프를 단순 그래프로 변환

        if graph.is_directed():
            graph = graph.to_undirected()  # 방향 그래프를 무방향 그래프로 변환

        graph.remove_edges_from(nx.selfloop_edges(graph))
        A = nx.to_numpy_array(graph)
        n = A.shape[0]
        # 선택한 메소드에 따른 처리
        if method == "BE":
            model = Borgatti_Everett(graph, A, n)
            try:
                n_iterations = int(parameters_dict['n_iter'])
            except:
                n_iterations = 1000
            cp_index, cp_metric, cp_cluster = model.fit(n_iterations)
            node_edge_data = preprocess.graph_node_edge(graph, cp_index=cp_index)
            metric = {"rho": cp_metric}
        elif method == "Brusco":
            model = Brusco(graph, A, n)
            try:
                n_iterations = int(parameters_dict['n_iter'])
            except:
                n_iterations = 1000
            cp_index, cp_metric, cp_cluster = model.fit(n_iterations)
            node_edge_data = preprocess.graph_node_edge(graph, cp_index=cp_index)
            metric = {"Z": int(cp_metric)}

        elif method == "Holme":
            model = Holme(graph)
            try:
                n_iterations = int(parameters_dict['n_iter'])
            except:
                n_iterations = 100
            cp_metric, core_indices, core_centrality = model.holme_metric(graph, n_iterations)
            node_edge_data = preprocess.graph_node_edge(graph, cp_index=core_indices)
            metric = {"C_cp": cp_metric, "Core_Centrality": core_centrality}

        elif method == "Lip":
            model = Lip(graph, A)
            z_influence, core_indices, z = model.calculate()
            node_edge_data = preprocess.graph_node_edge(graph, cp_index=core_indices, cp_node_metric=z_influence)
            print(core_indices)
            print(z)
            metric = {"Z": int(z)}

        elif method == "LLC":
            model = Low_Rank_Core(graph)
            try:
                beta = float(parameters_dict['beta'])
            except:
                beta = None
            scores, core_indices, q = model.low_rank_core(beta=beta)
            node_edge_data = preprocess.graph_node_edge(graph, cp_index=core_indices, cp_node_metric=scores)
            metric = {"Q": q}

        elif method == "Minre":
            model = Minre(graph, A)
            try:
                n_iterations = int(parameters_dict['n_iter'])
            except:
                n_iterations = 10000
            w, indices, PRE = model.minres(max_iter=n_iterations)
            node_edge_data = preprocess.graph_node_edge(graph, cp_index=w, cp_node_metric=w)
            metric = {"PRE": PRE}

        elif method == "Rombach":
            model = Rombach(graph, A)
            try:
                n_iterations = int(parameters_dict['n_iter'])
            except:
                n_iterations = 10000
            best_order, core_scores_optimized, result, R_gamma = model.optimize(step=n_iterations)
            node_edge_data = preprocess.graph_node_edge(graph, cp_index=core_scores_optimized, cp_node_metric=core_scores_optimized)
            metric = {"R_gamma": R_gamma}

        elif method == "Silva":
            model = Silva(graph)
            try:
                threshold = float(parameters_dict['threshold'])
            except:
                threshold = 0.9
            cc, core_indices, capcity_order, cumulative_capacity = model.silva_core_coefficient(graph, threshold)
            node_edge_data = preprocess.graph_node_edge(graph, cp_index=core_indices)
            metric = {"cc": cc}


        elif method == "Rossa":
            model = Rossa(graph)
            alpha = model.get_alpha()
            cp_centralization = model.get_cp_centralization()
            node_edge_data = preprocess.graph_node_edge(graph, cp_index=alpha, cp_node_metric=alpha)
            metric = {"cp_centrality": cp_centralization}


        elif method == "KM_Config":
            model = KM_Config(graph)


        elif method == "KM_ER":
            model = KM_ER(graph)


        elif method == "ICPA":
            model = ICPA(graph)

        else:
            raise HTTPException(status_code=400, detail="Invalid method")

        # 노드 및 엣지 데이터 처리 후 파일로 저장
        output_file = JSON_DIR / f"node_edge.json"
        metric_file = JSON_DIR / f"metric.json"
        with open(output_file, "w") as f:
            json.dump(node_edge_data, f, indent=4)

        with open(metric_file, "w") as f:
            json.dump(metric, f, indent=4)
        
        return {"message": "Algorithm applied successfully", "filepath": str(output_file)}

    
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    


# GEXF 파일 업로드 및 분석 처리
@app.post("/uploadCurrent/")
async def upload_graph(data: GraphWithMethod):
    try:
        graphData = data.graphData
        method = data.method
                # networkx 그래프 생성
        G = nx.Graph()
        core_indices = graphData.core_indices
        for node in graphData.nodes:
            G.add_node(
                node.id,
                label=node.label,
                degree=node.degree,
                degree_centrality=node.degree_centrality,
                betweenness_centrality=node.betweenness_centrality,
                closeness_centrality=node.closeness_centrality,
                eigenvector_centrality=node.eigenvector_centrality,
                core_periphery=node.core_periphery,
                core_periphery_score=node.core_periphery_score,
                attributes=node.attributes,
                pos=(node.x, node.y)  # 노드의 좌표 추가
            )

        # 엣지 추가
        for edge in graphData.edges:
            G.add_edge(
                edge.source,
                edge.target,
                weight=edge.weight,
                attributes=edge.attributes
            )
        A = nx.to_numpy_array(G)
        n = A.shape[0]

        # 선택한 메소드에 따른 처리
        if method == "BE":

            model = Borgatti_Everett(G, A, n)
            rho = model.borgatti_everett_correlation(core_indices)
            metric = {"rho": rho}

        elif method == "Brusco":
            model = Brusco(G, A, n)
            Z = model.brusco_metric(core_indices)
            metric = {"Z": int(Z)}

        elif method == "Holme":
            model = Holme(G)
            nodes = list(G.nodes())
            core_nodes = []
            for i in core_indices:
                core_nodes.append(nodes[i])

            c_cp, core_centrality = model.holme_refresh(G, core_nodes)
            metric = {"C_cp": c_cp, "Core_Centrality": core_centrality}

        elif method == "Lip":
            model = Lip(G, A)
            print(core_indices)
            z = model.brusco_metric(core_indices)
            metric = {"Z": int(z)}

        elif method == "LLC":
            try :
                beta = float(stored_parameters[list(stored_parameters.keys())[0]]['beta'])
            except:
                beta = None
            model = Low_Rank_Core(G)
            q = model.low_rank_core_refresh(core_indices, beta=beta)
            metric = {"Q": q}

        elif method == "Minre":
            model = Minre(G)

        elif method == "Rombach":
            model = Rombach(G)

        elif method == "Silva":
            model = Silva(G)

        elif method == "Rossa":
            model = Rossa(G)
            alpha = model.get_alpha()
            cp_centralization = model.get_cp_centralization()
            node_edge_data = preprocess.graph_node_edge(G, cp_index=alpha)
            metric = {"cp_centrality": cp_centralization}


        elif method == "KM_Config":
            model = KM_Config(G)


        elif method == "KM_ER":
            model = KM_ER(G)


        elif method == "ICPA":
            model = ICPA(G)

        else:
            raise HTTPException(status_code=400, detail="Invalid method")



        # 처리된 후 성공 메시지를 반환
        return {"message": "Metric Refreshed.", "metric": metric}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
