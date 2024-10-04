import numpy as np
import numba

class Lip:
    def __init__(self, G, A):
        self.G = G
        self.A = A

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def calculate_brusco_metric(A, n, core_indices, periphery_indices):
        core_core_edges = 0
        periphery_periphery_edges = 0

        for i in range(n):
            for j in range(i + 1, n):
                if i in core_indices and j in core_indices:
                    if A[i, j] == 0:
                        core_core_edges += 1
                if i in periphery_indices and j in periphery_indices:
                    if A[i, j] == 1:
                        periphery_periphery_edges += 1

        return core_core_edges + periphery_periphery_edges


    def brusco_metric(self, core_indices):
        n = self.A.shape[0]
        periphery_indices = self.get_periphery_indices(n, core_indices)
        return self.calculate_brusco_metric(self.A, n, core_indices, periphery_indices)
    
    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def calculate_numba(A):
        n = A.shape[0]
        deg = A.sum(axis=1)
        sorted_indices = np.argsort(-deg)
        Z_best = np.inf
        k_best = 0
        Z_influence = np.zeros(n)

        # Z의 초기값을 설정
        Z = 0.5 * deg.sum()
        for k in range(1, n):
            v_k = sorted_indices[k-1]
            Z_influence[v_k] = k - 1 - deg[v_k]
            Z += Z_influence[v_k]
            
            if Z < Z_best:
                Z_best = Z
                k_best = k

        S1 = sorted_indices[:k_best]
        return Z_influence, S1, Z_best

    def calculate(self):
        z_influence, cores, z = self.calculate_numba(self.A)
        n = self.A.shape[0]
        core_indices = [0 for _ in range(n)]
        for i in cores:
            core_indices[i] = 1

        return z_influence, core_indices, z