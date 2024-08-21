import numpy as np
import networkx as nx
import numba


class Minre:
    def __init__(self, G, A):
        self.G = G
        self.A = A

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def normalize_w(w):
        norm_factor = np.sqrt(np.sum(w ** 2))
        w_normalized = w / norm_factor
        w_min = np.min(w_normalized)
        w_max = np.max(w_normalized)
        w_scaled = (w_normalized - w_min) / (w_max - w_min)
        return w_scaled

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def calculate_pre(A, w):
        n = A.shape[0]
        
        # ww^T 계산
        wwT = np.outer(w, w)

        # 비대각선 요소들만 합산하기 위해 직접 반복문을 사용
        total_ss = 0.0
        residual_ss = 0.0
        mean_A = 0.0
        count = 0

        for i in range(n):
            for j in range(i + 1, n):
                mean_A += A[i, j]
                count += 1

        mean_A /= count

        for i in range(n):
            for j in range(i + 1, n):
                total_ss += (A[i, j] - mean_A) ** 2
                residual_ss += (A[i, j] - wwT[i, j]) ** 2
        
        pre = 1 - (residual_ss / total_ss)
        return pre

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def minres_algorithm(A, tol, max_iter, learning_rate):
        n = A.shape[0]
        w = np.random.rand(n)

        for _ in range(max_iter):
            gradient = np.zeros(n)
            for i in range(n):
                for j in range(n):
                    if i != j:
                        gradient[i] += -2 * (A[i, j] - w[i] * w[j]) * w[j]

            w_new = w - learning_rate * gradient

            if np.linalg.norm(w_new - w) < tol:
                break

            w = w_new

        return w

    def minres(self, tol=1e-5, max_iter=10000, learning_rate=0.001, cutoff = 0.5):
        A = self.A
        w = self.minres_algorithm(A, tol, max_iter, learning_rate)
        self.PRE = self.calculate_pre(A, w)
        self.w = self.normalize_w(w)
        self.indices = np.where(self.w > cutoff)[0]
        return self.w, self.indices, self.PRE
    
