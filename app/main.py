from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os
import preprocess
import numpy as np
import json
from typing import Optional, Dict
from pydantic import BaseModel
import networkx as nx

from algorithms.borgatti_everett import Borgatti_Everett
from algorithms.rossa import Rossa


app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 앱이 실행되는 포트
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


# 그래프 인접 행렬 데이터 API
@app.get("/graph/adjacency/")
async def get_graph_adjacency(filename: str):
    try:
        file_location = UPLOAD_DIR / filename
        if not file_location.exists():
            raise HTTPException(status_code=404, detail="File not found")

        graph = preprocess.load_gexf_to_graph(str(file_location))
        cp_index = np.zeros(graph.number_of_nodes())
        adjacency_data = preprocess.graph_adjacency(graph, cp_index)

        output_file = JSON_DIR / f"adjacency.json"
        with open(output_file, "w") as f:
            json.dump(adjacency_data, f, indent=4)

        return JSONResponse(content={"message": "Adjacency data saved successfully", "filepath": str(output_file)})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/graph/adjacency-json/")
async def get_graph_adjacency_json():
    if not ADJFILE.exists():
        raise HTTPException(status_code=404, detail="Node Edge file not found")
    return FileResponse(ADJFILE, media_type='application/json')

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
        elif method == "Rossa":
            model = Rossa(graph)
            alpha = model.get_alpha()
            cp_centralization = model.get_cp_centralization()
            node_edge_data = preprocess.graph_node_edge(graph, cp_index=alpha)
            metric = {"cp_centrality": cp_centralization}
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
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/graph/metric-json/")
async def get_graph_metric_json():
    if not METFILE.exists():
        raise HTTPException(status_code=404, detail="Metric file not found")
    return FileResponse(METFILE, media_type='application/json')