import numpy as np
import numba
import networkx as nx


class Metric_Calculator:
    def __init__(self, G, core_indices):
        self.G = G
        self.A = nx.to_numpy_array(G)
        self.n = self.A.shape[0]
        self.core_indices = core_indices

    def get_core_periphery_probabilities(self, threshold=0.5):
        core_nodes = np.where(self.core_indices > 0.5)[0]
        periphery_nodes = [node for node in range(self.n) if node not in core_nodes]
        
        core_core_edges = 0
        core_peri_edges = 0
        peri_peri_edges = 0

        total_core_core_possible = len(core_nodes) * (len(core_nodes) - 1) / 2
        total_core_peri_possible = len(core_nodes) * len(periphery_nodes)
        total_peri_peri_possible = len(periphery_nodes) * (len(periphery_nodes) - 1) / 2


        for i in core_nodes:
            for j in core_nodes:
                if i > j and self.G.has_edge(list(self.G.nodes())[i], list(self.G.nodes())[j]):
                    core_core_edges += 1

        for i in core_nodes:
            for j in periphery_nodes:
                if self.G.has_edge(list(self.G.nodes())[i], list(self.G.nodes())[j]):
                    core_peri_edges += 1

        for i in periphery_nodes:
            for j in periphery_nodes:
                if i > j and self.G.has_edge(list(self.G.nodes())[i], list(self.G.nodes())[j]):
                    peri_peri_edges += 1

        core_core_prob = core_core_edges / total_core_core_possible if total_core_core_possible > 0 else 0
        core_peri_prob = core_peri_edges / total_core_peri_possible if total_core_peri_possible > 0 else 0
        peri_peri_prob = peri_peri_edges / total_peri_peri_possible if total_peri_peri_possible > 0 else 0

        return core_core_prob, core_peri_prob, peri_peri_prob
    
    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def create_core_periphery_matrix(n, core_indices):
        delta = np.zeros((n, n))
        core_indices_set = set(core_indices)  # Convert list to set for faster lookup
        for i in range(n):
            if i in core_indices_set:
                delta[i, :] = 1
                delta[:, i] = 1
        return delta
    
    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def pearson_correlation(x, y):
        n = len(x)
        sum_x = 0.0
        sum_y = 0.0
        sum_x_sq = 0.0
        sum_y_sq = 0.0
        sum_xy = 0.0
        
        for i in range(n):
            sum_x += x[i]
            sum_y += y[i]
            sum_x_sq += x[i] ** 2
            sum_y_sq += y[i] ** 2
            sum_xy += x[i] * y[i]
        
        numerator = sum_xy - (sum_x * sum_y / n)
        denominator = np.sqrt((sum_x_sq - sum_x ** 2 / n) * (sum_y_sq - sum_y ** 2 / n))
        
        if denominator == 0:
            return 0.0
        else:
            return numerator / denominator
        
    def borgatti_everett_correlation(self):
        n = self.A.shape[0]
        core_indices = np.where(self.core_indices > 0.5)[0]
        delta = self.create_core_periphery_matrix(n, core_indices)
        A_flat = self.A.flatten()
        delta_flat = delta.flatten()
        # Compute Pearson correlation
        rho = self.pearson_correlation(A_flat, delta_flat)
        return rho
    

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def calculate_brusco_metric(A, n, core_indices, periphery_indices):
        core_core_edges = 0
        periphery_periphery_edges = 0

        for i in range(n):
            for j in range(i + 1, n):
                if i in core_indices and j in core_indices:
                    if A[i, j] == 1:
                        core_core_edges += 1
                if i in periphery_indices and j in periphery_indices:
                    if A[i, j] == 0:
                        periphery_periphery_edges += 1

        return core_core_edges + periphery_periphery_edges

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def get_periphery_indices(n, core_indices):
        periphery_indices = [i for i in range(n) if i not in core_indices]
        return periphery_indices

    def brusco_metric(self):
        core_indices = np.where(self.core_indices > 0.5)[0]
        periphery_indices = self.get_periphery_indices(self.n, core_indices)
        return self.calculate_brusco_metric(self.A, self.n, core_indices, periphery_indices)
    
    def calculate_core_quality(self):
        """코어 품질 R_{alpha, beta}를 계산합니다."""
        A = self.A
        C = self.core_indices
        return np.sum(A * np.outer(C, C))