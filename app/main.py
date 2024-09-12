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
    group: float
    attributes: Dict[str, Any]  # This matches the Record<string, any> in TypeScript

# Define EdgeData to match the TypeScript interface
class EdgeData(BaseModel):
    source: str
    target: str
    weight: float
    attributes: Dict[str, Any]  # This matches the Record<string, any> in TypeScript


# GraphData model to hold nodes and edges
class GraphData(BaseModel):
    nodes: List[NodeData]
    edges: List[EdgeData]
    core_indices: List[int]

class GraphWithMethod(BaseModel):
    graphData: GraphData
    method: str


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

        graph = preprocess.load_gexf_to_graph(str(file_location))
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
    return FileResponse(OVERVIEW_FILE, media_type='application/json')

# 그래프 노드 및 엣지 데이터 API
@app.get("/graph/node-edge/")
async def get_graph_node_edge(filename: str):
    try:
        file_location = UPLOAD_DIR / filename
        if not file_location.exists():
            raise HTTPException(status_code=404, detail="File not found")

        graph = preprocess.load_gexf_to_graph(str(file_location))
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
    return FileResponse(NODEFILE, media_type='application/json')



    
@app.get("/graph/adjacency-init/")
async def get_graph_adjacency_json(filename: str):
    try:
        file_location = UPLOAD_DIR / filename
        if not file_location.exists():
            raise HTTPException(status_code=404, detail="File not found")

        graph = preprocess.load_gexf_to_graph(str(file_location))
        cp_index = np.zeros(graph.number_of_nodes())
        graph_json = preprocess.graph_adjacency(G=graph, cp_index=cp_index)
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
        else:
            parameters_dict = {}

        # 파일 위치 확인 및 처리
        file_location = UPLOAD_DIR / filename
        if not file_location.exists():
            raise HTTPException(status_code=404, detail="File not found")

        graph = preprocess.load_gexf_to_graph(str(file_location))
        A = nx.to_numpy_array(graph)
        n = A.shape[0]
        # 선택한 메소드에 따른 처리
        if method == "BE":
            model = Borgatti_Everett(graph, A, n)
            cp_index, cp_metric, cp_cluster = model.fit()
            node_edge_data = preprocess.graph_node_edge(graph, cp_index=cp_index)
            metric = {"rho": cp_metric}
        elif method == "Brusco":
            model = Brusco(graph, A, n)
            cp_index, cp_metric, cp_cluster = model.fit()
            node_edge_data = preprocess.graph_node_edge(graph, cp_index=cp_index)
            metric = {"Z": int(cp_metric)}

        elif method == "Holme":
            model = Holme(graph)

        elif method == "Lip":
            model = Lip(graph)

        elif method == "LowRankCore":
            model = Low_Rank_Core(graph)

        elif method == "Minre":
            model = Minre(graph)

        elif method == "Rombach":
            model = Rombach(graph)

        elif method == "Silva":
            model = Silva(graph)

        elif method == "Rossa":
            model = Rossa(graph)
            alpha = model.get_alpha()
            cp_centralization = model.get_cp_centralization()
            node_edge_data = preprocess.graph_node_edge(graph, cp_index=alpha)
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

        return {"message": "Adjacency data saved successfully", "filepath": str(output_file)}

    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/graph/metric-json/")
async def get_graph_metric_json():
    if not METFILE.exists():
        raise HTTPException(status_code=404, detail="Metric file not found")
    return FileResponse(METFILE, media_type='application/json')



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
            cp_index, cp_metric, cp_cluster = model.fit()
            node_edge_data = preprocess.graph_node_edge(G, cp_index=cp_index)
            metric = {"Z": int(cp_metric)}

        elif method == "Holme":
            model = Holme(G)

        elif method == "Lip":
            model = Lip(G)

        elif method == "LowRankCore":
            model = Low_Rank_Core(G)

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
