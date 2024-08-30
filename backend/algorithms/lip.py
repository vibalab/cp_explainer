import numpy as np
import numba

class Lip:
    def __init__(self, G, A):
        self.G = G
        self.A = A

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
        return self.calculate_numba(self.A)